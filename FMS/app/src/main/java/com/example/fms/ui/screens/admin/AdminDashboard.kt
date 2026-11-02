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
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
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

@OptIn(ExperimentalMaterial3Api::class)
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

    val listState = androidx.compose.foundation.lazy.rememberLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(bottom = 110.dp),
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Hero Header integrated seamlessly into scroll flow
            item {
                HeroHeader(
                    title = "FMS Operations Command",
                    subtitle = "Cooperative Network & System Oversight",
                    roleBadge = "ADMIN COMMAND"
                )
            }

            // Platform KPIs Inset Group
            item {
                InsetGroup(
                    header = "Platform Overview",
                    footer = "Multi-tenant cooperative sync across Rift Valley & Central hubs."
                ) {
                    platformKpis.forEachIndexed { index, kpi ->
                        InsetRow(
                            title = kpi.title,
                            subtitle = kpi.subtitle,
                            leadingIcon = kpi.icon,
                            iconTint = kpi.trendColor,
                            iconBackgroundColor = kpi.trendColor.copy(alpha = 0.12f),
                            trailingText = kpi.value,
                            showChevron = false,
                            showDivider = index < platformKpis.size - 1
                        )
                    }
                }
            }

            // County Yield Progress Inset Group
            item {
                InsetGroup(
                    header = "Regional Intake Volumes",
                    footer = "Live dairy cooperative intake metrics updated every 15 minutes."
                ) {
                    countyData.forEachIndexed { index, county ->
                        InsetRow(
                            title = county.countyName,
                            subtitle = "${county.farmsCount} registered farms",
                            leadingIcon = Icons.Rounded.LocationCity,
                            iconTint = EmeraldPrimary,
                            iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                            trailingText = "${county.dailyLitres.toInt()} / ${county.targetLitres.toInt()} L",
                            trailingBadge = "${((county.dailyLitres / county.targetLitres) * 100).toInt()}%",
                            badgeColor = EmeraldPrimary,
                            showChevron = false,
                            showDivider = index < countyData.size - 1
                        )
                    }
                }
            }

            // Administrative Operations Inset Group
            item {
                InsetGroup(
                    header = "Administrative Controls",
                    footer = "Security safeguards: broadcast notices notify all registered cooperative farmers."
                ) {
                    InsetRow(
                        title = "Broadcast Biosecurity Advisory",
                        subtitle = "Send emergency SMS and push notices to farmers",
                        leadingIcon = Icons.Rounded.Campaign,
                        iconTint = RoseRed,
                        iconBackgroundColor = RoseRed.copy(alpha = 0.12f),
                        showChevron = true,
                        onClick = { showBroadcastDialog = true }
                    )
                    InsetRow(
                        title = "Export Cooperative Audit Log",
                        subtitle = "Download platform compliance CSV for KVB & regulator",
                        leadingIcon = Icons.Rounded.Download,
                        iconTint = ForestGreen,
                        iconBackgroundColor = ForestGreen.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = { /* Export CSV */ }
                    )
                }
            }

            // Audit Trail Inset Group
            item {
                InsetGroup(
                    header = "Platform Audit Trail (${auditLogs.size})",
                    footer = "Immutable audit log recorded for system integrity and accountability."
                ) {
                    auditLogs.forEachIndexed { index, log ->
                        val (statusBg, statusColor) = when (log.level) {
                            "WARNING" -> Pair(RoseRed.copy(alpha = 0.15f), RoseRed)
                            "SUCCESS" -> Pair(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary)
                            else -> Pair(SkyBlue.copy(alpha = 0.15f), SkyBlue)
                        }

                        InsetRow(
                            title = log.event,
                            subtitle = "${log.actor} • ${log.timeAgo}",
                            leadingIcon = Icons.Rounded.History,
                            iconTint = statusColor,
                            iconBackgroundColor = statusBg,
                            trailingBadge = log.level,
                            badgeColor = statusColor,
                            showChevron = false,
                            showDivider = index < auditLogs.size - 1
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(40.dp))
            }
        }

    if (showBroadcastDialog) {
        var alertMessage by remember { mutableStateOf("") }
        ModalBottomSheet(
            onDismissRequest = { showBroadcastDialog = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 10.dp, bottom = 6.dp)
                        .width(36.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Emergency Advisory Broadcast",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Cooperative SMS & Push Notification Dispatch",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = "Priority 1",
                        containerColor = RoseRed.copy(alpha = 0.15f),
                        contentColor = RoseRed
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                InsetGroup(
                    header = "Broadcast Audience"
                ) {
                    InsetRow(
                        title = "Recipient Group",
                        subtitle = "All verified farmers & herd managers",
                        trailingText = "1,420 Farms",
                        showChevron = false,
                        showDivider = true
                    )
                    InsetRow(
                        title = "Regional Coverage",
                        subtitle = "Uasin Gishu, Kiambu, Nandi, Nakuru",
                        trailingBadge = "4 Counties",
                        badgeColor = EmeraldPrimary,
                        showChevron = false,
                        showDivider = false
                    )
                }

                OutlinedTextField(
                    value = alertMessage,
                    onValueChange = { alertMessage = it },
                    placeholder = { Text("e.g. Mandatory vaccine camp scheduled this Thursday. Halt livestock movements...") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showBroadcastDialog = false },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Cancel")
                    }

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
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = RoseRed),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Campaign, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Send Broadcast", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
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
