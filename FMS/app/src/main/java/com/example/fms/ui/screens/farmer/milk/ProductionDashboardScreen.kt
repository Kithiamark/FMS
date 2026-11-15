package com.example.fms.ui.screens.farmer.milk

import android.widget.Toast
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
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class DailyLedgerItem(
    val date: String,
    val producedLitres: Double,
    val homeLitres: Double,
    val soldLitres: Double,
    val calvesLitres: Double,
    val isBalanced: Boolean = true
) {
    val unallocated: Double get() = producedLitres - (homeLitres + soldLitres + calvesLitres)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductionDashboardScreen(
    onBackClick: () -> Unit = {},
    onNavigateToRecord: () -> Unit = {},
    onNavigateToAllocation: () -> Unit = {}
) {
    val context = LocalContext.current
    var selectedMonth by remember { mutableStateOf("October 2026") }

    val monthsList = listOf("October 2026", "September 2026", "August 2026", "July 2026")

    // Daily Ledger Sample Data
    val ledgerItems = remember {
        listOf(
            DailyLedgerItem("Today, Oct 19", 126.5, 5.0, 110.0, 11.5, true),
            DailyLedgerItem("Yesterday, Oct 18", 128.0, 5.0, 111.0, 12.0, true),
            DailyLedgerItem("Thu, Oct 17", 124.5, 6.0, 108.0, 10.5, true),
            DailyLedgerItem("Wed, Oct 16", 129.0, 5.0, 112.5, 11.5, true),
            DailyLedgerItem("Tue, Oct 15", 121.0, 4.0, 106.0, 11.0, true),
            DailyLedgerItem("Mon, Oct 14", 125.5, 5.0, 110.0, 10.5, true),
            DailyLedgerItem("Sun, Oct 13", 127.0, 6.0, 109.5, 11.5, true)
        )
    }

    val totalProduced = 3842.5
    val totalHome = 155.0
    val totalSold = 3340.0
    val totalCalves = 347.5
    val avgDaily = 124.0

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Dairy Production Analytics",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "Monthly Yields, Shift Curves & Usage Ledger",
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
                actions = {
                    IconButton(onClick = {
                        Toast.makeText(context, "Exporting milk summary report...", Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(
                            imageVector = Icons.Rounded.Download,
                            contentDescription = "Export Report",
                            tint = EmeraldPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToRecord,
                containerColor = EmeraldPrimary,
                contentColor = Color.White,
                icon = { Icon(Icons.Rounded.Add, contentDescription = null) },
                text = { Text("Record Milk", fontWeight = FontWeight.Bold) },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.padding(bottom = 70.dp)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 120.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Month Picker Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(monthsList) { m ->
                            val isSelected = selectedMonth == m
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedMonth = m },
                                label = { Text(m, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                    selectedLabelColor = EmeraldPrimary
                                )
                            )
                        }
                    }
                }
            }

            // 2. 5 KPI Summary Cards (Grid)
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Row 1: Produced & Average
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        IslandCard(modifier = Modifier.weight(1.2f)) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("TOTAL PRODUCED", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${"%,.1f".format(totalProduced)} L", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                                Text("31 Days Recorded", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        IslandCard(modifier = Modifier.weight(1f)) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("DAILY AVERAGE", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${"%.1f".format(avgDaily)} L", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("Across 24 cows", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    // Row 2: Breakdown (Home, Sold, Calves)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Sold
                        IslandCard(modifier = Modifier.weight(1f)) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("SOLD (COOP)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ForestGreen)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("${"%,.0f".format(totalSold)} L", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ForestGreen)
                                Text("87.0% of total", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        // Calves
                        IslandCard(modifier = Modifier.weight(1f)) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("CALF REARING", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = GoldAmber)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("${"%,.0f".format(totalCalves)} L", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldAmber)
                                Text("9.0% of total", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        // Home
                        IslandCard(modifier = Modifier.weight(1f)) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("HOUSEHOLD", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = SkyBlue)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("${"%,.0f".format(totalHome)} L", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = SkyBlue)
                                Text("4.0% of total", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }

            // 3. Shift Production Curves & Allocation Progress
            item {
                IslandCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Milk Allocation Ratio",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            PillBadge(
                                text = "100% BALANCED",
                                color = EmeraldPrimary,
                                backgroundColor = EmeraldLight
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Segmented Ratio Bar
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(12.dp)
                                .clip(RoundedCornerShape(6.dp))
                        ) {
                            // Sold (87%)
                            Box(
                                modifier = Modifier
                                    .weight(0.87f)
                                    .fillMaxHeight()
                                    .background(ForestGreen)
                            )
                            // Calves (9%)
                            Box(
                                modifier = Modifier
                                    .weight(0.09f)
                                    .fillMaxHeight()
                                    .background(GoldAmber)
                            )
                            // Home (4%)
                            Box(
                                modifier = Modifier
                                    .weight(0.04f)
                                    .fillMaxHeight()
                                    .background(SkyBlue)
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Legend Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(ForestGreen))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Sold (87%)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(GoldAmber))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Calves (9%)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(SkyBlue))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Home (4%)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }

            // 4. Daily Production Ledger Section Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Daily Production Ledger (${ledgerItems.size} days)",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    TextButton(onClick = onNavigateToAllocation) {
                        Text("Rebalance ➔", color = EmeraldPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            // 5. Daily Ledger Items
            items(ledgerItems, key = { it.date }) { item ->
                IslandCard {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToRecord() }
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Left: Date & Produced
                        Column {
                            Text(
                                text = item.date,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Rounded.WaterDrop,
                                    contentDescription = null,
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "${item.producedLitres} L Produced",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = EmeraldPrimary
                                )
                            }
                        }

                        // Right: Usage breakdown & badge
                        Column(horizontalAlignment = Alignment.End) {
                            PillBadge(
                                text = "Balanced",
                                color = EmeraldPrimary,
                                backgroundColor = EmeraldLight
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Sold: ${item.soldLitres}L • Calf: ${item.calvesLitres}L",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

@Preview(name = "ProductionDashboardScreen Light", showBackground = true)
@Composable
fun ProductionDashboardScreenLightPreview() {
    FMSTheme(darkTheme = false) {
        ProductionDashboardScreen()
    }
}

@Preview(name = "ProductionDashboardScreen Dark", showBackground = true)
@Composable
fun ProductionDashboardScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        ProductionDashboardScreen()
    }
}
