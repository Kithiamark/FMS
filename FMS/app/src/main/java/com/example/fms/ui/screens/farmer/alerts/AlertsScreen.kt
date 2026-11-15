package com.example.fms.ui.screens.farmer.alerts

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

data class FarmerAlert(
    val id: String,
    val alertType: String, // VACCINATION_DUE, BREEDING_DUE, HEALTH_CHECKUP, LOW_YIELD_WARNING, WITHDRAWAL_ACTIVE, SABBATH_FREEZE, CUSTOM
    val title: String,
    val message: String,
    val animalTag: String? = null,
    val scheduledAt: String,
    val channel: String = "SMS", // SMS, PUSH, EMAIL, ALL
    var isRead: Boolean = false,
    val isPriorityUrgent: Boolean = false
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlertsScreen(
    onBackClick: () -> Unit = {}
) {
    var selectedFilter by remember { mutableStateOf("ALL") }
    var showCreateModal by remember { mutableStateOf(false) }

    // Form state for creating reminder
    var newAlertType by remember { mutableStateOf("VACCINATION_DUE") }
    var newAnimalTag by remember { mutableStateOf("#104 Bessie") }
    var newChannel by remember { mutableStateOf("SMS") }
    var newMessage by remember { mutableStateOf("") }
    var newScheduledWhen by remember { mutableStateOf("Tomorrow at 06:30 AM") }

    var alertsList by remember {
        mutableStateOf(
            listOf(
                FarmerAlert(
                    id = "alt_1",
                    alertType = "WITHDRAWAL_ACTIVE",
                    title = "Antibiotic Milk Withdrawal Period Active",
                    message = "Cow #104 (Bessie) received intramammary penicillin therapy. Milk withdrawal period is active for 48 more hours. Do NOT dump milk into the bulk chiller tank!",
                    animalTag = "#104 Bessie",
                    scheduledAt = "Active Now • Expires Oct 24 06:00 PM",
                    channel = "PUSH & SMS",
                    isRead = false,
                    isPriorityUrgent = true
                ),
                FarmerAlert(
                    id = "alt_2",
                    alertType = "BREEDING_DUE",
                    title = "Standing Heat 21-Day Cycle Follow-up",
                    message = "Cow #112 (Bella) is due for breeding cycle observation. Check standing heat reflex, clear mucus discharge, and vulval swelling between 05:00 AM and 08:00 AM.",
                    animalTag = "#112 Bella",
                    scheduledAt = "Tomorrow, 05:00 AM",
                    channel = "SMS",
                    isRead = false,
                    isPriorityUrgent = false
                ),
                FarmerAlert(
                    id = "alt_3",
                    alertType = "VACCINATION_DUE",
                    title = "FMD Booster Vaccination Due",
                    message = "Semi-annual Foot and Mouth Disease (FMD) booster vaccination window opens for 14 adult cows. Contact Dr. Kiprono to book batch herd vaccination.",
                    animalTag = "Herd-wide (14 head)",
                    scheduledAt = "Friday, 09:00 AM",
                    channel = "ALL",
                    isRead = false,
                    isPriorityUrgent = false
                ),
                FarmerAlert(
                    id = "alt_4",
                    alertType = "SABBATH_FREEZE",
                    title = "Sabbath Settlement Freeze Reminder",
                    message = "Automated M-Pesa payments and buyer settlements will pause Friday 18:00 to Saturday 18:00 EAT in observance of the Sabbath. All active plans auto-extend.",
                    animalTag = "Platform Policy",
                    scheduledAt = "Friday, 06:00 PM",
                    channel = "PUSH",
                    isRead = true,
                    isPriorityUrgent = false
                ),
                FarmerAlert(
                    id = "alt_5",
                    alertType = "LOW_YIELD_WARNING",
                    title = "Unusual Production Drop Detected",
                    message = "Evening yield for Daisy (#108) dropped from 14.5L to 9.2L (-36.5%). Automated CMT screening is recommended at morning milking.",
                    animalTag = "#108 Daisy",
                    scheduledAt = "Yesterday, 07:15 PM",
                    channel = "SMS",
                    isRead = true,
                    isPriorityUrgent = false
                )
            )
        )
    }

    val unreadCount = alertsList.count { !it.isRead }

    val filterCategories = remember {
        listOf(
            "ALL" to "All Alerts",
            "WITHDRAWAL" to "Withdrawals",
            "VACCINE" to "Vaccines",
            "BREEDING" to "Heat Cycles",
            "SABBATH" to "Sabbath",
            "PRODUCTION" to "Yield Warnings"
        )
    }

    val filteredAlerts = alertsList.filter { alert ->
        when (selectedFilter) {
            "ALL" -> true
            "WITHDRAWAL" -> alert.alertType == "WITHDRAWAL_ACTIVE"
            "VACCINE" -> alert.alertType == "VACCINATION_DUE"
            "BREEDING" -> alert.alertType == "BREEDING_DUE"
            "SABBATH" -> alert.alertType == "SABBATH_FREEZE"
            "PRODUCTION" -> alert.alertType == "LOW_YIELD_WARNING"
            else -> true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Dairy Alerts & Notices",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Herd health, withdrawal, breeding & schedules",
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
                actions = {
                    IconButton(onClick = { showCreateModal = true }) {
                        Icon(
                            imageVector = Icons.Rounded.AddAlert,
                            contentDescription = "Create Alert",
                            tint = EmeraldPrimary
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
            // Header Stats & Shortcuts
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Unread Count Metric
                    IslandCard(
                        modifier = Modifier.weight(1f)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .background(
                                        if (unreadCount > 0) RosePrimary.copy(alpha = 0.15f) else EmeraldLight,
                                        CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Rounded.NotificationsActive,
                                    contentDescription = null,
                                    tint = if (unreadCount > 0) RosePrimary else ForestGreen,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "UNREAD",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    letterSpacing = 0.5.sp
                                )
                                Text(
                                    text = "$unreadCount Alerts",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (unreadCount > 0) RosePrimary else ForestGreen
                                )
                            }
                        }
                    }

                    // Create Schedule Quick Action
                    IslandCard(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { showCreateModal = true }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .background(EmeraldLight, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Rounded.Add,
                                    contentDescription = null,
                                    tint = ForestGreen,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "SCHEDULE",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    letterSpacing = 0.5.sp
                                )
                                Text(
                                    text = "New Reminder",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            // Category Filter Chips
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(filterCategories) { (key, label) ->
                        val isSelected = selectedFilter == key
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
                                .clickable { selectedFilter = key }
                                .padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) ForestGreen else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }

            // Alerts Queue Items
            if (filteredAlerts.isEmpty()) {
                item {
                    IslandCard(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(36.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Rounded.NotificationsNone,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No alerts in this category",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(filteredAlerts) { alert ->
                    AlertItemCard(
                        alert = alert,
                        onMarkRead = {
                            alertsList = alertsList.map {
                                if (it.id == alert.id) it.copy(isRead = !it.isRead) else it
                            }
                        }
                    )
                }
            }

            // Bottom clearance for island bar
            item {
                Spacer(modifier = Modifier.height(84.dp))
            }
        }
    }

    // Schedule Custom Reminder Modal
    if (showCreateModal) {
        IslandModal(
            isOpen = true,
            onClose = { showCreateModal = false },
            title = "Schedule Herd Alert"
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Alert Type",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Select Type
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("VACCINATION_DUE" to "Vaccine", "BREEDING_DUE" to "Heat", "CUSTOM" to "Custom").forEach { (typeKey, typeLabel) ->
                        val isTypeSelected = newAlertType == typeKey
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isTypeSelected) EmeraldPrimary else MaterialTheme.colorScheme.surfaceVariant)
                                .clickable { newAlertType = typeKey }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = typeLabel,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isTypeSelected) ForestGreen else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                // Target Cow
                Text(
                    text = "Target Cattle",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = newAnimalTag,
                    onValueChange = { newAnimalTag = it },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    placeholder = { Text("e.g. #104 Bessie or Herd-wide", fontSize = 12.sp) }
                )

                // When
                Text(
                    text = "Scheduled When",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = newScheduledWhen,
                    onValueChange = { newScheduledWhen = it },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    placeholder = { Text("e.g. Tomorrow at 06:00 AM", fontSize = 12.sp) }
                )

                // Message Text
                Text(
                    text = "Reminder Notes / Instructions",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = newMessage,
                    onValueChange = { newMessage = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp),
                    shape = RoundedCornerShape(12.dp),
                    placeholder = { Text("What needs to be done...", fontSize = 12.sp) }
                )

                // Delivery Channel
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Notification Channel:",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("SMS", "PUSH", "ALL").forEach { ch ->
                            val isChSelected = newChannel == ch
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isChSelected) ForestGreen else MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable { newChannel = ch }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = ch,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isChSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showCreateModal = false },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancel", fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            if (newMessage.isNotBlank()) {
                                alertsList = listOf(
                                    FarmerAlert(
                                        id = "custom_${System.currentTimeMillis()}",
                                        alertType = newAlertType,
                                        title = if (newAlertType == "VACCINATION_DUE") "Vaccination Reminder" else "Scheduled Herd Reminder",
                                        message = newMessage,
                                        animalTag = newAnimalTag,
                                        scheduledAt = newScheduledWhen,
                                        channel = newChannel,
                                        isRead = false,
                                        isPriorityUrgent = false
                                    )
                                ) + alertsList
                            }
                            newMessage = ""
                            showCreateModal = false
                        },
                        modifier = Modifier.weight(1.4f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Text("Save Alert", fontSize = 12.sp, color = ForestGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun AlertItemCard(
    alert: FarmerAlert,
    onMarkRead: () -> Unit
) {
    IslandCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(15.dp)
        ) {
            // Header row with Icon, Tag, Time, and Read status
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Type Icon
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .background(
                                when {
                                    alert.isPriorityUrgent -> RosePrimary.copy(alpha = 0.15f)
                                    alert.alertType == "WITHDRAWAL_ACTIVE" -> GoldAmber.copy(alpha = 0.15f)
                                    alert.alertType == "BREEDING_DUE" -> ForestGreen.copy(alpha = 0.12f)
                                    else -> EmeraldLight
                                },
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = when {
                                alert.isPriorityUrgent -> Icons.Rounded.Warning
                                alert.alertType == "WITHDRAWAL_ACTIVE" -> Icons.Rounded.MedicalServices
                                alert.alertType == "BREEDING_DUE" -> Icons.Rounded.Favorite
                                alert.alertType == "VACCINATION_DUE" -> Icons.Rounded.Vaccines
                                alert.alertType == "SABBATH_FREEZE" -> Icons.Rounded.Schedule
                                else -> Icons.Rounded.Notifications
                            },
                            contentDescription = null,
                            tint = when {
                                alert.isPriorityUrgent -> RosePrimary
                                alert.alertType == "WITHDRAWAL_ACTIVE" -> GoldAmber
                                alert.alertType == "BREEDING_DUE" -> ForestGreen
                                else -> EmeraldPrimary
                            },
                            modifier = Modifier.size(17.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = alert.animalTag ?: "Farm-wide",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                // Channel pill
                PillBadge(
                    text = alert.channel,
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Title
            Text(
                text = alert.title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = if (alert.isPriorityUrgent) RosePrimary else MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Body
            Text(
                text = alert.message,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 17.sp
            )

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
            Spacer(modifier = Modifier.height(8.dp))

            // Footer with Schedule and Mark Read button
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Rounded.AccessTime,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = alert.scheduledAt,
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onMarkRead() }
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (alert.isRead) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                        contentDescription = null,
                        tint = if (alert.isRead) ForestGreen else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (alert.isRead) "Read" else "Mark Read",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (alert.isRead) ForestGreen else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Preview(name = "AlertsScreen - Light Mode", showBackground = true)
@Composable
fun AlertsScreenLightPreview() {
    FMSTheme(darkTheme = false) {
        AlertsScreen()
    }
}

@Preview(name = "AlertsScreen - Dark Mode", showBackground = true)
@Composable
fun AlertsScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        AlertsScreen()
    }
}
