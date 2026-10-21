package com.example.fms.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.*
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.DailyMilkSummary
import com.example.fms.data.model.FarmTask
import com.example.fms.ui.components.HeroHeader
import com.example.fms.ui.components.IslandCard
import com.example.fms.ui.components.PillBadge
import com.example.fms.ui.theme.*

@Composable
fun FarmerDashboard(
    onNavigateToRecordMilk: () -> Unit = {},
    onNavigateToHerd: () -> Unit = {},
    onNavigateToFinance: () -> Unit = {}
) {
    var milkSummary by remember {
        mutableStateOf(
            DailyMilkSummary(
                date = "Today",
                morningYield = 72.5,
                eveningYield = 54.0,
                homeUseLitres = 5.0,
                soldLitres = 110.0,
                calvesLitres = 11.5
            )
        )
    }

    var tasks by remember {
        mutableStateOf(
            listOf(
                FarmTask("1", "Morning Milking Check", "Inspect milk storage cooler temperature", "COMPLETED", "Today"),
                FarmTask("2", "Replenish Mineral Lick", "Paddock 2 salt blocks", "PENDING", "Today"),
                FarmTask("3", "Calf Teat Bucket Cleaning", "Wash buckets with sanitizing solution", "PENDING", "Today")
            )
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // 1. Hero Header Island
        item {
            HeroHeader(
                title = "Kithia Dairy Farm",
                subtitle = "Active Enterprise Plan • 24 Cows in Milking",
                roleBadge = "FARM OWNER",
                onNotificationClick = { }
            )
        }

        // 2. OVERLAPPING HORIZON METRICS ISLAND
        // Offset upward by -28.dp so it overlaps smoothly on top of the green hero
        item {
            Column(
                modifier = Modifier
                    .offset(y = (-28).dp)
                    .padding(horizontal = 20.dp)
            ) {
                IslandCard(
                    elevation = 8.dp,
                    containerColor = MaterialTheme.colorScheme.surface
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "DAILY MILK TOTAL",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${milkSummary.totalProduced} L",
                                fontSize = 32.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = EmeraldPrimary,
                                letterSpacing = (-1).sp
                            )
                        }

                        PillBadge(
                            text = "100% Balanced",
                            containerColor = EmeraldLight,
                            contentColor = ForestGreen,
                            icon = Icons.Rounded.CheckCircle
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    Spacer(modifier = Modifier.height(16.dp))

                    // Secondary Sub-Metrics
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        MetricPill(
                            label = "Morning",
                            value = "${milkSummary.morningYield}L",
                            color = GoldAmber,
                            icon = Icons.Rounded.WbSunny
                        )
                        MetricPill(
                            label = "Evening",
                            value = "${milkSummary.eveningYield}L",
                            color = SkyBlue,
                            icon = Icons.Rounded.NightsStay
                        )
                        MetricPill(
                            label = "Sold",
                            value = "${milkSummary.soldLitres}L",
                            color = ForestGreen,
                            icon = Icons.Rounded.ShoppingCart
                        )
                        MetricPill(
                            label = "Calves",
                            value = "${milkSummary.calvesLitres}L",
                            color = RoseRed,
                            icon = Icons.Rounded.Favorite
                        )
                    }
                }
            }
        }

        // 3. Quick Operations Island Bar
        item {
            Column(
                modifier = Modifier
                    .offset(y = (-16).dp)
                    .padding(horizontal = 20.dp)
            ) {
                Text(
                    text = "Quick Actions",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionButton(
                        title = "Log Milk",
                        icon = Icons.Rounded.AddCircleOutline,
                        color = ForestGreen,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToRecordMilk
                    )
                    QuickActionButton(
                        title = "Herd",
                        icon = Icons.Rounded.Pets,
                        color = SkyBlue,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToHerd
                    )
                    QuickActionButton(
                        title = "Expense",
                        icon = Icons.AutoMirrored.Rounded.ReceiptLong,
                        color = GoldAmber,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToFinance
                    )
                }
            }
        }

        // 4. Herd Health Risk Island
        item {
            Column(
                modifier = Modifier
                    .offset(y = (-4).dp)
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                IslandCard(
                    containerColor = MaterialTheme.colorScheme.surface
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = RoseLight,
                                modifier = Modifier.size(38.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Rounded.HealthAndSafety,
                                        contentDescription = null,
                                        tint = RoseRed,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Column {
                                Text(
                                    text = "Herd Health Status",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "1 cow due for mastitis check",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        PillBadge(
                            text = "Checkup Due",
                            containerColor = AmberLight,
                            contentColor = GoldAmber
                        )
                    }
                }
            }
        }

        // 5. Personal Farm To-Do List Island
        item {
            Column(
                modifier = Modifier
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Daily Farm Chores",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "${tasks.count { it.status == "COMPLETED" }}/${tasks.size} done",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = EmeraldPrimary
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                tasks.forEach { task ->
                    val isDone = task.status == "COMPLETED"
                    IslandCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        cornerRadius = 16.dp,
                        elevation = 2.dp,
                        onClick = {
                            tasks = tasks.map {
                                if (it.id == task.id) {
                                    it.copy(status = if (isDone) "PENDING" else "COMPLETED")
                                } else it
                            }
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = if (isDone) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                                contentDescription = null,
                                tint = if (isDone) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(22.dp)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = task.title,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = if (isDone) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = task.description,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun MetricPill(
    label: String,
    value: String,
    color: Color,
    icon: ImageVector
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        Surface(
            shape = CircleShape,
            color = color.copy(alpha = 0.12f),
            modifier = Modifier.size(32.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
        Text(
            text = value,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun QuickActionButton(
    title: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 3.dp,
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = color.copy(alpha = 0.15f),
                modifier = Modifier.size(28.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = color,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Farmer Dashboard Light")
@Composable
fun FarmerDashboardPreview() {
    FMSTheme(darkTheme = false) {
        FarmerDashboard()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Farmer Dashboard Dark")
@Composable
fun FarmerDashboardDarkPreview() {
    FMSTheme(darkTheme = true) {
        FarmerDashboard()
    }
}
