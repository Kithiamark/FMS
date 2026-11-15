package com.example.fms.ui.screens.aggregator

import androidx.compose.animation.*
import androidx.compose.foundation.background
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

data class AggregatorConnection(
    val id: String,
    val farmName: String,
    val farmerName: String,
    val location: String,
    val dailySupplyLitres: Double,
    val paymentTerms: String, // Weekly, Bi-weekly, Monthly
    val status: String // ACTIVE, PENDING_CONTRACT
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AggregatorConnectionsScreen(
    onBackClick: () -> Unit = {}
) {
    val connections = remember {
        listOf(
            AggregatorConnection("c1", "Baraka Dairy Cooperative", "Mark Kipkorir", "Eldoret", 280.0, "Weekly", "ACTIVE"),
            AggregatorConnection("c2", "Chepkemoi Hill Farm", "Faith Chepkemoi", "Kapsabet", 145.5, "Weekly", "ACTIVE"),
            AggregatorConnection("c3", "Sunrise Highland Pastoral", "Kiprono Bett", "Nandi Hills", 92.0, "Bi-weekly", "ACTIVE"),
            AggregatorConnection("c4", "Riverbend Smallholders Group", "Samson Kiprop", "Muhoroni", 180.0, "Monthly", "PENDING_CONTRACT")
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Farmer Supply Network", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Sourcing Contracts & Daily Quotas", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
            item {
                IslandCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Total Sourced Supply", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("697.5 Litres / day", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                        }
                        PillBadge("4 Cooperatives", containerColor = EmeraldPrimary.copy(alpha = 0.15f), contentColor = EmeraldPrimary)
                    }
                }
            }

            items(connections, key = { it.id }) { conn ->
                IslandCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(conn.farmName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            PillBadge(
                                text = conn.status,
                                containerColor = if (conn.status == "ACTIVE") EmeraldPrimary.copy(alpha = 0.15f) else GoldAmber.copy(alpha = 0.15f),
                                contentColor = if (conn.status == "ACTIVE") EmeraldPrimary else GoldAmber
                            )
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(conn.farmerName, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("• ${conn.location}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Daily Quota: ${conn.dailySupplyLitres} L", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = EmeraldPrimary)
                            Text("Payout: ${conn.paymentTerms}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
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
