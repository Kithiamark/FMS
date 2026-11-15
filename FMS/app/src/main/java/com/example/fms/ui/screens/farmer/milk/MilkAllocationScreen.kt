package com.example.fms.ui.screens.farmer.milk

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MilkAllocationScreen(
    totalYield: Double = 126.5,
    onBackClick: () -> Unit = {},
    onAllocationSaved: (calves: Double, home: Double, coop: Double, direct: Double, spoilage: Double) -> Unit = { _, _, _, _, _ -> }
) {
    var calvesLitres by remember { mutableStateOf("11.5") }
    var homeUseLitres by remember { mutableStateOf("5.0") }
    var coopBulkLitres by remember { mutableStateOf("95.0") }
    var directRetailLitres by remember { mutableStateOf("15.0") }
    var spoilageLitres by remember { mutableStateOf("0.0") }
    var coopPricePerLitre by remember { mutableStateOf("50") }
    var directPricePerLitre by remember { mutableStateOf("65") }
    var showSavedSnackbar by remember { mutableStateOf(false) }

    val calvesVal = calvesLitres.toDoubleOrNull() ?: 0.0
    val homeVal = homeUseLitres.toDoubleOrNull() ?: 0.0
    val coopVal = coopBulkLitres.toDoubleOrNull() ?: 0.0
    val directVal = directRetailLitres.toDoubleOrNull() ?: 0.0
    val spoilageVal = spoilageLitres.toDoubleOrNull() ?: 0.0

    val totalAllocated = calvesVal + homeVal + coopVal + directVal + spoilageVal
    val unallocated = totalYield - totalAllocated
    val isBalanced = Math.abs(unallocated) < 0.05
    val isOverAllocated = unallocated < -0.05

    val coopRev = coopVal * (coopPricePerLitre.toDoubleOrNull() ?: 0.0)
    val directRev = directVal * (directPricePerLitre.toDoubleOrNull() ?: 0.0)
    val totalEstRevenue = coopRev + directRev

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Daily Milk Allocation",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Reconcile 100% of morning & evening yield",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    PillBadge(
                        text = if (isBalanced) "100% Balanced" else if (isOverAllocated) "Over-allocated" else "Remaining: ${"%.1f".format(unallocated)}L",
                        containerColor = if (isBalanced) EmeraldPrimary.copy(alpha = 0.15f) else if (isOverAllocated) RoseRed.copy(alpha = 0.15f) else GoldAmber.copy(alpha = 0.15f),
                        contentColor = if (isBalanced) EmeraldPrimary else if (isOverAllocated) RoseRed else GoldAmber,
                        icon = if (isBalanced) Icons.Rounded.CheckCircle else Icons.Rounded.WarningAmber,
                        onClick = {
                            if (!isBalanced && unallocated > 0) {
                                val currentCoop = coopBulkLitres.toDoubleOrNull() ?: 0.0
                                coopBulkLitres = "%.1f".format(currentCoop + unallocated)
                            }
                        }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Summary Inset Group
            item {
                InsetGroup(
                    header = "Today's Milk Balance",
                    footer = if (isBalanced) "100% of yield is fully accounted for." else if (isOverAllocated) "Allocated volume exceeds recorded yield by ${"%.1f".format(-unallocated)}L." else "${"%.1f".format(unallocated)}L remaining to be dispatched."
                ) {
                    InsetRow(
                        title = "Total Production",
                        subtitle = "Morning + evening batches",
                        leadingIcon = Icons.Rounded.WaterDrop,
                        trailingText = "${"%.1f".format(totalYield)} L",
                        showChevron = false
                    )
                    InsetRow(
                        title = "Total Allocated",
                        subtitle = "Dispatched across channels",
                        leadingIcon = Icons.Rounded.PieChart,
                        trailingText = "${"%.1f".format(totalAllocated)} L",
                        showChevron = false
                    )
                    InsetRow(
                        title = "Estimated Gross Revenue",
                        subtitle = "Co-op & direct sales",
                        leadingIcon = Icons.Rounded.MonetizationOn,
                        iconTint = ForestGreen,
                        iconBackgroundColor = ForestGreen.copy(alpha = 0.12f),
                        trailingText = "KES ${"%,.0f".format(totalEstRevenue)}",
                        trailingBadge = if (isBalanced) "Balanced" else "Incomplete",
                        badgeColor = if (isBalanced) EmeraldPrimary else GoldAmber,
                        showChevron = false,
                        showDivider = false
                    )
                }
            }

            // Allocation Channels Inset Group
            item {
                InsetGroup(
                    header = "Allocation Channels & Pricing",
                    footer = "Prices per litre dynamically calculate projected daily sales earnings."
                ) {
                    AllocationChannelRow(
                        title = "Cooperative Bulk Intake",
                        subtitle = "Bulk cans to chilling center • ${"%.1f".format(coopVal)}L",
                        icon = Icons.Rounded.Storefront,
                        iconTint = EmeraldPrimary,
                        litresValue = coopBulkLitres,
                        onLitresChange = { coopBulkLitres = it },
                        unitPrice = coopPricePerLitre,
                        onPriceChange = { coopPricePerLitre = it },
                        subtotalText = "KES ${"%,.0f".format(coopRev)}",
                        showDivider = true
                    )

                    AllocationChannelRow(
                        title = "Direct Farmgate / Retail",
                        subtitle = "Bottled for households • ${"%.1f".format(directVal)}L",
                        icon = Icons.Rounded.LocalShipping,
                        iconTint = ForestGreen,
                        litresValue = directRetailLitres,
                        onLitresChange = { directRetailLitres = it },
                        unitPrice = directPricePerLitre,
                        onPriceChange = { directPricePerLitre = it },
                        subtotalText = "KES ${"%,.0f".format(directRev)}",
                        showDivider = true
                    )

                    AllocationChannelRow(
                        title = "Calf Nursery Feeding",
                        subtitle = "Fresh milk bucket-fed to calves",
                        icon = Icons.Rounded.ChildCare,
                        iconTint = SkyBlue,
                        litresValue = calvesLitres,
                        onLitresChange = { calvesLitres = it },
                        showDivider = true
                    )

                    AllocationChannelRow(
                        title = "Home & Farm Workers",
                        subtitle = "Domestic tea & worker rations",
                        icon = Icons.Rounded.Home,
                        iconTint = GoldAmber,
                        litresValue = homeUseLitres,
                        onLitresChange = { homeUseLitres = it },
                        showDivider = true
                    )

                    AllocationChannelRow(
                        title = "Spoiled / Mastitic Discard",
                        subtitle = "Discarded (CMT / withdrawal)",
                        icon = Icons.Rounded.DeleteOutline,
                        iconTint = RoseRed,
                        litresValue = spoilageLitres,
                        onLitresChange = { spoilageLitres = it },
                        showDivider = false
                    )
                }
            }

            // Quick Auto-Balance Button & Submit Button
            item {
                Spacer(modifier = Modifier.height(6.dp))
                if (!isBalanced && unallocated > 0) {
                    OutlinedButton(
                        onClick = {
                            val currentCoop = coopBulkLitres.toDoubleOrNull() ?: 0.0
                            coopBulkLitres = "%.1f".format(currentCoop + unallocated)
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.AutoFixHigh, contentDescription = null, modifier = Modifier.size(18.dp), tint = ForestGreen)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Auto-Allocate Remainder (${"%.1f".format(unallocated)}L) to Co-op",
                            color = ForestGreen,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }

                Button(
                    onClick = {
                        onAllocationSaved(calvesVal, homeVal, coopVal, directVal, spoilageVal)
                        showSavedSnackbar = true
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(
                        imageVector = if (isBalanced) Icons.Rounded.CheckCircle else Icons.Rounded.Save,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isBalanced) "Save Daily Allocation ✓" else "Save Allocation (${"%.1f".format(unallocated)}L remaining)",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }

                if (showSavedSnackbar) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        color = EmeraldPrimary.copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.4f))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = EmeraldPrimary)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Milk allocation saved and synchronized!",
                                color = EmeraldPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

@Composable
private fun AllocationChannelRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconTint: Color,
    litresValue: String,
    onLitresChange: (String) -> Unit,
    unitPrice: String? = null,
    onPriceChange: ((String) -> Unit)? = null,
    subtotalText: String? = null,
    showDivider: Boolean = true
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = iconTint.copy(alpha = 0.12f),
                    modifier = Modifier.size(38.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
                    }
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        title,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        subtitle,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.width(10.dp))

            OutlinedTextField(
                value = litresValue,
                onValueChange = onLitresChange,
                placeholder = { Text("0.0", fontSize = 13.sp) },
                suffix = { Text("L", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                singleLine = true,
                modifier = Modifier.width(96.dp).height(48.dp),
                shape = RoundedCornerShape(10.dp)
            )
        }

        if (unitPrice != null && onPriceChange != null) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 66.dp, end = 16.dp, bottom = 10.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Price/L:", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    OutlinedTextField(
                        value = unitPrice,
                        onValueChange = onPriceChange,
                        placeholder = { Text("50", fontSize = 12.sp) },
                        prefix = { Text("KES ", fontSize = 10.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.width(90.dp).height(44.dp),
                        shape = RoundedCornerShape(8.dp)
                    )
                }

                if (subtotalText != null) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Subtotal", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(subtotalText, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ForestGreen)
                    }
                }
            }
        }

        if (showDivider) {
            HorizontalDivider(
                modifier = Modifier.padding(start = 66.dp),
                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f),
                thickness = 0.5.dp
            )
        }
    }
}

@Preview(showBackground = true, name = "Milk Allocation Light")
@Composable
fun MilkAllocationScreenPreview() {
    FMSTheme(darkTheme = false) {
        MilkAllocationScreen()
    }
}

@Preview(showBackground = true, name = "Milk Allocation Dark")
@Composable
fun MilkAllocationScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        MilkAllocationScreen()
    }
}
