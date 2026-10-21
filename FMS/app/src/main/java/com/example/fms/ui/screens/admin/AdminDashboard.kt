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
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class PlatformMetric(
    val title: String,
    val value: String,
    val subtitle: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val trendColor: Color
)

data class CountyAggregate(
    val countyName: String,
    val farmsCount: Int,
    val dailyLitres: Double,
    val targetLitres: Double
)

data class PlatformAuditLog(
    val id: String,
    val event: String,
    val actor: String,
    val timeAgo: String,
    val level: String // INFO, WARNING, SUCCESS
)

@Composable
fun AdminDashboard() {
    val platformKpis = listOf(
        PlatformMetric("Total Registered Farms", "1,420", "+38 this month", Icons.Rounded.Agriculture, EmeraldPrimary),
        PlatformMetric("Daily Aggregate Yield", "48,250 L", "Across 4 counties", Icons.Rounded.WaterDrop, SkyBlue),
        PlatformMetric("Active Licensed Vets", "84", "100% verified KVB", Icons.Rounded.MedicalServices, ForestGreen),
        PlatformMetric("Monthly Platform MRR", "KES 1.84M", "Netflix-model web", Icons.Rounded.Payments, GoldAmber)
    )

    val countyData = listOf(
        CountyAggregate("Uasin Gishu", 480, 18400.0, 20000.0),
        CountyAggregate("Kiambu", 390, 14200.0, 15000.0),
        CountyAggregate("Nandi", 310, 9850.0, 11000.0),
        CountyAggregate("Nakuru", 240, 5800.0, 8000.0)
    )

    var auditLogs by remember {
        mutableStateOf(
            listOf(
                PlatformAuditLog("a1", "Emergency Biosecurity Alert broadcasted to Uasin Gishu farmers", "System / DVM Admin", "25m ago", "WARNING"),
                PlatformAuditLog("a2", "New Vet Practice License approved (KVB #8402 - Dr. Cheruiyot)", "Coop Registry", "2h ago", "SUCCESS"),
                PlatformAuditLog("a3", "Batch #9042 flagged: Alcohol clot positive (Rejected at Brookside hub)", "Milk Lab System", "4h ago", "INFO"),
                PlatformAuditLog("a4", "Saturday billing freeze automated batch executed successfully", "Payment Webhook", "1d ago", "SUCCESS")
            )
        )
    }

    var showBroadcastDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Header
        item {
            HeroHeader(
                title = "FMS Operations Command",
                subtitle = "Cooperative Network & System Oversight"
            )
        }

        // Platform KPIs 2x2 Grid
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Platform Core Performance",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )

                // First Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    KpiStatCard(metric = platformKpis[0], modifier = Modifier.weight(1f))
                    KpiStatCard(metric = platformKpis[1], modifier = Modifier.weight(1f))
                }

                // Second Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    KpiStatCard(metric = platformKpis[2], modifier = Modifier.weight(1f))
                    KpiStatCard(metric = platformKpis[3], modifier = Modifier.weight(1f))
                }
            }
        }

        // County Yield Progress Bars
        item {
            IslandCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Regional Volume Intake",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        PillBadge(
                            text = "4 Counties Active",
                            containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                            contentColor = EmeraldPrimary
                        )
                    }

                    countyData.forEach { county ->
                        val progress = (county.dailyLitres / county.targetLitres).toFloat().coerceIn(0f, 1f)
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${county.countyName} (${county.farmsCount} farms)",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "${county.dailyLitres.toInt()} / ${county.targetLitres.toInt()} L",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary
                                )
                            }
                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = EmeraldPrimary,
                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        }
                    }
                }
            }
        }

        // Quick Admin Controls
        item {
            IslandCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Administrative Actions",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = { showBroadcastDialog = true },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = RoseRed)
                        ) {
                            Icon(Icons.Rounded.Campaign, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Broadcast Alert", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = { /* Export CSV */ },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Rounded.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Export Audit", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Audit Trail Feed
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "System Audit Trail",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )

                auditLogs.forEach { log ->
                    IslandCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = when (log.level) {
                                    "WARNING" -> RoseRed.copy(alpha = 0.15f)
                                    "SUCCESS" -> EmeraldPrimary.copy(alpha = 0.15f)
                                    else -> SkyBlue.copy(alpha = 0.15f)
                                },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = when (log.level) {
                                            "WARNING" -> Icons.Rounded.Warning
                                            "SUCCESS" -> Icons.Rounded.CheckCircle
                                            else -> Icons.Rounded.Info
                                        },
                                        contentDescription = null,
                                        tint = when (log.level) {
                                            "WARNING" -> RoseRed
                                            "SUCCESS" -> EmeraldPrimary
                                            else -> SkyBlue
                                        },
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = log.event,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(text = log.actor, fontSize = 11.sp, color = EmeraldPrimary)
                                    Text(text = "· ${log.timeAgo}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(40.dp))
        }
    }

    if (showBroadcastDialog) {
        var alertMessage by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showBroadcastDialog = false },
            title = { Text("Cooperative Broadcast Alert", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Broadcast an emergency SMS and Community banner to all registered farmers:", fontSize = 13.sp)
                    OutlinedTextField(
                        value = alertMessage,
                        onValueChange = { alertMessage = it },
                        placeholder = { Text("e.g. Mandatory vaccine camp scheduled this Thursday...") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (alertMessage.isNotBlank()) {
                            auditLogs = listOf(
                                PlatformAuditLog(
                                    id = "a_${System.currentTimeMillis()}",
                                    event = alertMessage,
                                    actor = "Admin Broadcast",
                                    timeAgo = "Just now",
                                    level = "WARNING"
                                )
                            ) + auditLogs
                        }
                        showBroadcastDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseRed)
                ) {
                    Text("Send Broadcast")
                }
            },
            dismissButton = {
                TextButton(onClick = { showBroadcastDialog = false }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
fun KpiStatCard(
    metric: PlatformMetric,
    modifier: Modifier = Modifier
) {
    IslandCard(modifier = modifier) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = metric.title,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
                Icon(
                    imageVector = metric.icon,
                    contentDescription = null,
                    tint = metric.trendColor,
                    modifier = Modifier.size(18.dp)
                )
            }

            Text(
                text = metric.value,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = metric.subtitle,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = metric.trendColor
            )
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Admin Dashboard Light")
@Composable
fun AdminDashboardPreview() {
    FMSTheme(darkTheme = false) {
        AdminDashboard()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Admin Dashboard Dark")
@Composable
fun AdminDashboardDarkPreview() {
    FMSTheme(darkTheme = true) {
        AdminDashboard()
    }
}
