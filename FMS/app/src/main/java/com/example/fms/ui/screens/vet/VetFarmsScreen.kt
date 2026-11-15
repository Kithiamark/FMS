package com.example.fms.ui.screens.vet

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class ClientFarmItem(
    val id: String,
    val name: String,
    val owner: String,
    val phone: String,
    val county: String,
    val totalCattle: Int,
    val lactatingCount: Int,
    val clinicalFlag: String? = null // e.g. "Mastitis Follow-up", "Vaccine Due"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VetFarmsScreen(
    onBackClick: () -> Unit = {},
    onFarmSelected: (ClientFarmItem) -> Unit = {}
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }

    val clientFarms = remember {
        listOf(
            ClientFarmItem(
                id = "f_1",
                name = "Baraka Dairy Farm",
                owner = "Mark Kipkorir",
                phone = "+254712345678",
                county = "Uasin Gishu (Chepkoilel)",
                totalCattle = 28,
                lactatingCount = 18,
                clinicalFlag = "Penicillin Withdrawal Active"
            ),
            ClientFarmItem(
                id = "f_2",
                name = "Highland Pastures",
                owner = "Faith Chepkemoi",
                phone = "+254722987654",
                county = "Nandi (Kapsabet)",
                totalCattle = 34,
                lactatingCount = 22,
                clinicalFlag = "FMD Booster Due"
            ),
            ClientFarmItem(
                id = "f_3",
                name = "Kiprono Meadow Ranch",
                owner = "David Kiprono",
                phone = "+254733112233",
                county = "Kericho (Bureti)",
                totalCattle = 19,
                lactatingCount = 12,
                clinicalFlag = null
            ),
            ClientFarmItem(
                id = "f_4",
                name = "Green Valley Homestead",
                owner = "John Mwangi",
                phone = "+254701234567",
                county = "Kiambu (Githunguri)",
                totalCattle = 15,
                lactatingCount = 10,
                clinicalFlag = null
            )
        )
    }

    val filteredFarms = clientFarms.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
                it.owner.contains(searchQuery, ignoreCase = true) ||
                it.county.contains(searchQuery, ignoreCase = true)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Connected Client Farms",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "Veterinary Network Directory (${clientFarms.size} farms)",
                            fontSize = 12.sp,
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
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 120.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = {
                        Text(
                            "Search farm, owner, or county...",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Rounded.Search,
                            contentDescription = "Search",
                            tint = EmeraldPrimary
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                    )
                )
            }

            // Farms List
            if (filteredFarms.isEmpty()) {
                item {
                    IslandCard {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(36.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.DomainDisabled,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(44.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No client farms found",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Try searching with a different farm name or county.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(filteredFarms, key = { it.id }) { farm ->
                    IslandCard {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                        ) {
                            // Header: Name & Icon
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = farm.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "Farmer: ${farm.owner}",
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(EmeraldPrimary.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.HomeWork,
                                        contentDescription = null,
                                        tint = EmeraldPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }

                            // County & Status
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.LocationOn,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = farm.county,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                PillBadge(
                                    text = "ACTIVE CLIENT",
                                    color = EmeraldPrimary,
                                    backgroundColor = EmeraldLight
                                )
                            }

                            // Headcount & Clinical Flag
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${farm.totalCattle} Total Head (${farm.lactatingCount} in milk)",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )

                                if (farm.clinicalFlag != null) {
                                    PillBadge(
                                        text = farm.clinicalFlag,
                                        color = GoldAmber,
                                        backgroundColor = AmberLight
                                    )
                                }
                            }

                            // Actions Row
                            Spacer(modifier = Modifier.height(14.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL).apply {
                                            data = Uri.parse("tel:${farm.phone}")
                                        }
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = PaddingValues(vertical = 8.dp)
                                ) {
                                    Icon(Icons.Rounded.Phone, contentDescription = "Call", modifier = Modifier.size(15.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Call Farmer", fontSize = 12.sp)
                                }

                                Button(
                                    onClick = { onFarmSelected(farm) },
                                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.weight(1f),
                                    contentPadding = PaddingValues(vertical = 8.dp)
                                ) {
                                    Icon(Icons.Rounded.Assignment, contentDescription = null, modifier = Modifier.size(15.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Herd Records", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Preview(name = "VetFarmsScreen Light", showBackground = true)
@Composable
fun VetFarmsScreenLightPreview() {
    FMSTheme(darkTheme = false) {
        VetFarmsScreen()
    }
}

@Preview(name = "VetFarmsScreen Dark", showBackground = true)
@Composable
fun VetFarmsScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        VetFarmsScreen()
    }
}
