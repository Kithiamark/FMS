package com.example.fms.ui.screens.farmer.buyers

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

data class BuyerOffTaker(
    val id: String,
    val organizationName: String,
    val contactPerson: String,
    val phone: String,
    val county: String,
    val operatingCounties: List<String>,
    val tankerCapacityLitres: Int,
    val farmgatePriceKes: Double,
    val paymentTerms: String, // e.g. "Weekly via M-Pesa", "Bi-weekly", "Monthly 5th"
    val isVerified: Boolean = true,
    val qualityRequirements: String = "Lactometer >= 1.028 • Alcohol 68%",
    val connectionStatus: ConnectionStatus = ConnectionStatus.NONE
)

enum class ConnectionStatus {
    NONE,
    PENDING,
    CONNECTED
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FindBuyerScreen(
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedCounty by remember { mutableStateOf("All Counties") }
    var selectedBuyerForConnect by remember { mutableStateOf<BuyerOffTaker?>(null) }
    var connectNote by remember { mutableStateOf("") }
    var showConnectSuccessModal by remember { mutableStateOf(false) }

    val counties = remember {
        listOf(
            "All Counties", "Kiambu", "Murang'a", "Nyeri", "Nyandarua",
            "Nakuru", "Meru", "Embu", "Kirinyaga", "Uasin Gishu"
        )
    }

    var buyers by remember {
        mutableStateOf(
            listOf(
                BuyerOffTaker(
                    id = "b1",
                    organizationName = "Limuru Dairy Farmers Cooperative Society",
                    contactPerson = "Jane Wanjiku (Field Procurement)",
                    phone = "+254711223344",
                    county = "Kiambu",
                    operatingCounties = listOf("Kiambu", "Murang'a"),
                    tankerCapacityLitres = 12000,
                    farmgatePriceKes = 54.50,
                    paymentTerms = "Weekly on Mondays via M-Pesa",
                    isVerified = true,
                    connectionStatus = ConnectionStatus.CONNECTED
                ),
                BuyerOffTaker(
                    id = "b2",
                    organizationName = "Brookside Chilling Intake Hub - Annex",
                    contactPerson = "Francis Maina (Route Supervisor)",
                    phone = "+254722334455",
                    county = "Nakuru",
                    operatingCounties = listOf("Nakuru", "Nyandarua", "Uasin Gishu"),
                    tankerCapacityLitres = 20000,
                    farmgatePriceKes = 56.00,
                    paymentTerms = "Bi-weekly Bank / M-Pesa Payout",
                    isVerified = true,
                    connectionStatus = ConnectionStatus.PENDING
                ),
                BuyerOffTaker(
                    id = "b3",
                    organizationName = "Meru Central Dairy Union (Mt. Kenya Pure)",
                    contactPerson = "David Mugambi (Off-take Coordinator)",
                    phone = "+254733445566",
                    county = "Meru",
                    operatingCounties = listOf("Meru", "Embu"),
                    tankerCapacityLitres = 15000,
                    farmgatePriceKes = 55.00,
                    paymentTerms = "Monthly on 5th with bonus shares",
                    isVerified = true,
                    connectionStatus = ConnectionStatus.NONE
                ),
                BuyerOffTaker(
                    id = "b4",
                    organizationName = "Nyeri Highland Chilling Plant",
                    contactPerson = "Grace Muthoni (Station Manager)",
                    phone = "+254744556677",
                    county = "Nyeri",
                    operatingCounties = listOf("Nyeri", "Kirinyaga"),
                    tankerCapacityLitres = 8000,
                    farmgatePriceKes = 53.50,
                    paymentTerms = "Weekly on Fridays via M-Pesa",
                    isVerified = true,
                    connectionStatus = ConnectionStatus.NONE
                ),
                BuyerOffTaker(
                    id = "b5",
                    organizationName = "Bio Foods Artisan Procurement Hub",
                    contactPerson = "Kelvin Kibet (Quality Assurance)",
                    phone = "+254755667788",
                    county = "Kiambu",
                    operatingCounties = listOf("Kiambu", "Nakuru"),
                    tankerCapacityLitres = 6000,
                    farmgatePriceKes = 58.00,
                    paymentTerms = "Bi-weekly with fat/protein premium bonus",
                    isVerified = true,
                    qualityRequirements = "Density >= 1.030 • Under 4°C at intake",
                    connectionStatus = ConnectionStatus.NONE
                )
            )
        )
    }

    val filteredBuyers = buyers.filter { buyer ->
        val matchesCounty = selectedCounty == "All Counties" ||
                buyer.county.equals(selectedCounty, ignoreCase = true) ||
                buyer.operatingCounties.any { it.equals(selectedCounty, ignoreCase = true) }
        val matchesSearch = buyer.organizationName.contains(searchQuery, ignoreCase = true) ||
                buyer.contactPerson.contains(searchQuery, ignoreCase = true) ||
                buyer.county.contains(searchQuery, ignoreCase = true)
        matchesCounty && matchesSearch
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Verified Milk Buyers",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Dairy Co-ops, Chilling Hubs & Aggregators",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header Stats & Search
            item {
                Spacer(modifier = Modifier.height(4.dp))
                // Search Field
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    placeholder = {
                        Text(
                            "Search cooperative, chilling plant, or buyer...",
                            fontSize = 13.sp
                        )
                    },
                    leadingIcon = {
                        Icon(
                            Icons.Rounded.Search,
                            contentDescription = "Search",
                            tint = EmeraldPrimary
                        )
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Rounded.Close, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }

            // County Filter Chips
            item {
                Text(
                    text = "FILTER BY COUNTY",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(counties) { county ->
                        val isSelected = county == selectedCounty
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(
                                    if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.surface
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.25f),
                                    RoundedCornerShape(20.dp)
                                )
                                .clickable { selectedCounty = county }
                                .padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Text(
                                text = county,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) ForestGreen else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }

            // Results count banner
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${filteredBuyers.size} Verified Buyers Found",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Rounded.VerifiedUser,
                            contentDescription = null,
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "KDB Regulated",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldPrimary
                        )
                    }
                }
            }

            // Buyer Cards List
            if (filteredBuyers.isEmpty()) {
                item {
                    IslandCard(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                Icons.Rounded.SearchOff,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No buyers matching '$searchQuery' in $selectedCounty",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            } else {
                items(filteredBuyers) { buyer ->
                    BuyerCard(
                        buyer = buyer,
                        onCallBuyer = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${buyer.phone}"))
                            context.startActivity(intent)
                        },
                        onRequestConnect = {
                            selectedBuyerForConnect = buyer
                            connectNote = "Hello, I operate an active dairy herd in ${buyer.county}. We produce clean morning milk and request daily collection."
                        }
                    )
                }
            }

            // Bottom Spacer for Island Bottom Bar clearance
            item {
                Spacer(modifier = Modifier.height(84.dp))
            }
        }
    }

    // Modal Sheet for Off-take Connection Request
    selectedBuyerForConnect?.let { buyer ->
        IslandModal(
            isOpen = true,
            onClose = { selectedBuyerForConnect = null },
            title = "Request Milk Off-take"
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = buyer.organizationName,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Base payout: KES ${"%.2f".format(buyer.farmgatePriceKes)} / Litre • ${buyer.paymentTerms}",
                    fontSize = 12.sp,
                    color = EmeraldPrimary,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Message to Buyer Dispatch Manager:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
                OutlinedTextField(
                    value = connectNote,
                    onValueChange = { connectNote = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp),
                    shape = RoundedCornerShape(12.dp),
                    placeholder = { Text("Describe estimated daily production...", fontSize = 12.sp) }
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Quality confirmation check
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(EmeraldLight, RoundedCornerShape(10.dp))
                        .padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Rounded.CheckCircle,
                        contentDescription = null,
                        tint = ForestGreen,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Your milk conforms to ${buyer.qualityRequirements}.",
                        fontSize = 11.sp,
                        color = ForestGreen,
                        fontWeight = FontWeight.Medium
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { selectedBuyerForConnect = null },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancel", fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            // Update status to pending
                            buyers = buyers.map {
                                if (it.id == buyer.id) it.copy(connectionStatus = ConnectionStatus.PENDING) else it
                            }
                            selectedBuyerForConnect = null
                            showConnectSuccessModal = true
                        },
                        modifier = Modifier.weight(1.5f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text("Submit Request", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Success confirmation dialog
    if (showConnectSuccessModal) {
        IslandModal(
            isOpen = true,
            onClose = { showConnectSuccessModal = false },
            title = "Request Sent Successfully"
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(EmeraldLight, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Rounded.MarkEmailRead,
                        contentDescription = null,
                        tint = ForestGreen,
                        modifier = Modifier.size(28.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "The aggregator's route supervisor has received your farm profile, estimated herd size, and location.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { showConnectSuccessModal = false },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text("Done", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun BuyerCard(
    buyer: BuyerOffTaker,
    onCallBuyer: () -> Unit,
    onRequestConnect: () -> Unit
) {
    IslandCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header row with Icon, Name, and Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .background(EmeraldLight, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Rounded.Storefront,
                            contentDescription = null,
                            tint = ForestGreen,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = buyer.organizationName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Rounded.LocationOn,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = "${buyer.county} • Routes: ${buyer.operatingCounties.joinToString(", ")}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // Status Badge
                when (buyer.connectionStatus) {
                    ConnectionStatus.CONNECTED -> {
                        PillBadge(
                            text = "CONNECTED",
                            containerColor = EmeraldPrimary.copy(alpha = 0.2f),
                            contentColor = EmeraldPrimary
                        )
                    }
                    ConnectionStatus.PENDING -> {
                        PillBadge(
                            text = "PENDING REVIEW",
                            containerColor = GoldAmber.copy(alpha = 0.2f),
                            contentColor = GoldAmber
                        )
                    }
                    ConnectionStatus.NONE -> {
                        PillBadge(
                            text = "VERIFIED",
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
            Spacer(modifier = Modifier.height(12.dp))

            // Pricing & Terms Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "FARMGATE PRICE",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = "KES ${"%.2f".format(buyer.farmgatePriceKes)} / L",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = EmeraldPrimary
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "TANKER CAPACITY",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = "${buyer.tankerCapacityLitres.toString().replace(Regex("(\\d)(?=(\\d{3})+$)"), "$1,")} Litres",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Details list
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Rounded.Payments,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = buyer.paymentTerms,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Rounded.Science,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = buyer.qualityRequirements,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Actions row: Call & Connect
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = onCallBuyer,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        Icons.Rounded.Phone,
                        contentDescription = "Call",
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Call Offtaker", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }

                when (buyer.connectionStatus) {
                    ConnectionStatus.CONNECTED -> {
                        Button(
                            onClick = {},
                            enabled = false,
                            modifier = Modifier.weight(1.3f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                disabledContainerColor = EmeraldLight,
                                disabledContentColor = ForestGreen
                            )
                        ) {
                            Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Active Supplier", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    ConnectionStatus.PENDING -> {
                        Button(
                            onClick = {},
                            enabled = false,
                            modifier = Modifier.weight(1.3f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                disabledContainerColor = GoldAmber.copy(alpha = 0.2f),
                                disabledContentColor = GoldAmber
                            )
                        ) {
                            Icon(Icons.Rounded.Schedule, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Awaiting Review", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    ConnectionStatus.NONE -> {
                        Button(
                            onClick = onRequestConnect,
                            modifier = Modifier.weight(1.3f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                        ) {
                            Icon(Icons.Rounded.Hub, contentDescription = null, modifier = Modifier.size(14.dp), tint = ForestGreen)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Request Off-take", fontSize = 11.sp, color = ForestGreen, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Preview(name = "FindBuyerScreen - Light Mode", showBackground = true)
@Composable
fun FindBuyerScreenLightPreview() {
    FMSTheme(darkTheme = false) {
        FindBuyerScreen()
    }
}

@Preview(name = "FindBuyerScreen - Dark Mode", showBackground = true)
@Composable
fun FindBuyerScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        FindBuyerScreen()
    }
}
