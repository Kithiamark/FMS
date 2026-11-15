package com.example.fms.ui.screens.admin

import androidx.compose.animation.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class RegisteredFarm(
    val id: String,
    val farmName: String,
    val ownerName: String,
    val phone: String,
    val county: String,
    val herdCount: Int,
    val subscriptionTier: String, // ENTERPRISE, PRO, FREE_TRIAL
    val isVerified: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminFarmersScreen(
    onBackClick: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCounty by remember { mutableStateOf("ALL") }

    val farms = remember {
        listOf(
            RegisteredFarm("f1", "Baraka Dairy Farm", "Mark Kipkorir", "+254712345678", "Uasin Gishu", 24, "ENTERPRISE", true),
            RegisteredFarm("f2", "Chepkemoi Hill Farm", "Faith Chepkemoi", "+254722987654", "Nandi", 18, "PRO", true),
            RegisteredFarm("f3", "Highland Pastures", "Kiprono Bett", "+254733112233", "Nakuru", 32, "ENTERPRISE", true),
            RegisteredFarm("f4", "Limuru Heights Dairy", "Grace Njeri", "+254701234567", "Kiambu", 12, "FREE_TRIAL", false),
            RegisteredFarm("f5", "Sunset Valley Homestead", "Joseph Ouma", "+254799887766", "Kisumu", 9, "PRO", true)
        )
    }

    val filtered = farms.filter {
        (selectedCounty == "ALL" || it.county.equals(selectedCounty, ignoreCase = true)) &&
                (it.farmName.contains(searchQuery, ignoreCase = true) || it.ownerName.contains(searchQuery, ignoreCase = true))
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Registered Farms & Cooperatives", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("${farms.size} total farms registered on platform", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
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
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Search Input
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by farm or farmer name...") },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    singleLine = true
                )
            }

            // County Filters
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("ALL", "Uasin Gishu", "Kiambu", "Nandi", "Nakuru").forEach { c ->
                        FilterChip(
                            selected = selectedCounty == c,
                            onClick = { selectedCounty = c },
                            label = { Text(c, fontSize = 11.sp) },
                            shape = RoundedCornerShape(16.dp)
                        )
                    }
                }
            }

            items(filtered, key = { it.id }) { farm ->
                IslandCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(farm.farmName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            PillBadge(
                                text = farm.subscriptionTier,
                                containerColor = if (farm.subscriptionTier == "ENTERPRISE") EmeraldPrimary.copy(alpha = 0.15f) else GoldAmber.copy(alpha = 0.15f),
                                contentColor = if (farm.subscriptionTier == "ENTERPRISE") EmeraldPrimary else GoldAmber
                            )
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(farm.ownerName, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("• ${farm.county}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            if (farm.isVerified) {
                                Icon(Icons.Rounded.Verified, contentDescription = "Verified", tint = EmeraldPrimary, modifier = Modifier.size(16.dp))
                            }
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Herd: ${farm.herdCount} cattle", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(farm.phone, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = EmeraldPrimary)
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(70.dp))
            }
        }
    }
}
