package com.example.fms.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
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
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.FarmTask
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerDashboard(
    onNavigateToMilkLog: () -> Unit = {}
) {
    var chores by remember {
        mutableStateOf(
            listOf(
                FarmTask("w1", "Morning Milking - Pen A", "Milk 8 cows, sanitize cluster cups", "COMPLETED", "06:30 AM"),
                FarmTask("w2", "Clean Barn Alleyways", "Scrape slurry & disinfect stalls 1-12", "IN_PROGRESS", "08:30 AM"),
                FarmTask("w3", "Feed Hay & Silage", "Distribute 250kg fresh silage in Paddock 1", "PENDING", "11:00 AM"),
                FarmTask("w4", "Inspect Calf Health Tag #104", "Check for signs of scour or cough", "PENDING", "02:00 PM"),
                FarmTask("w5", "Evening Milking - Pen B", "Milk 7 cows, test California Mastitis Test", "PENDING", "04:30 PM")
            )
        )
    }

    var showMilkDialog by remember { mutableStateOf(false) }
    var cowTagInput by remember { mutableStateOf("") }
    var yieldInput by remember { mutableStateOf("") }
    var sessionLitresLogged by remember { mutableStateOf(58.5) }

    val completedCount = chores.count { it.status == "COMPLETED" }
    val progress = if (chores.isNotEmpty()) completedCount.toFloat() / chores.size else 0f

    val listState = androidx.compose.foundation.lazy.rememberLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(bottom = 110.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            // 1. Hero Header integrated seamlessly into scroll flow
            item {
                HeroHeader(
                    title = "Farm Operations",
                    subtitle = "Assigned to Barn Alpha • Morning & Midday Shift",
                    roleBadge = "FIELD WORKER"
                )
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }

            // 2. Shift Milking & Logging Inset Group
            item {
                InsetGroup(
                    header = "Active Milking Session",
                    footer = "Milk entries require OTP authorization from farm manager for edits or deletions."
                ) {
                    InsetRow(
                        title = "Logged This Session",
                        subtitle = "Morning milking in Barn Alpha",
                        leadingIcon = Icons.Rounded.WaterDrop,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        trailingText = "${"%.1f".format(sessionLitresLogged)} L",
                        trailingBadge = "Active",
                        badgeColor = EmeraldPrimary,
                        showChevron = true,
                        onClick = onNavigateToMilkLog
                    )
                    InsetRow(
                        title = "Open Milking Keypad",
                        subtitle = "Rapid cow-tag yield numpad",
                        leadingIcon = Icons.Rounded.Dialpad,
                        iconTint = ForestGreen,
                        iconBackgroundColor = ForestGreen.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = onNavigateToMilkLog
                    )
                }
            }

            // 3. Shift Chores Inset Group
            item {
                InsetGroup(
                    header = "Shift Chores ($completedCount/${chores.size})",
                    footer = "Tap any chore to cycle status (Pending ➔ In Progress ➔ Completed)."
                ) {
                    chores.forEachIndexed { index, chore ->
                        val isDone = chore.status == "COMPLETED"
                        val inProgress = chore.status == "IN_PROGRESS"

                        val statusIcon = when {
                            isDone -> Icons.Rounded.CheckCircle
                            inProgress -> Icons.Rounded.HourglassTop
                            else -> Icons.Rounded.RadioButtonUnchecked
                        }

                        val statusColor = when {
                            isDone -> EmeraldPrimary
                            inProgress -> GoldAmber
                            else -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                        }

                        InsetRow(
                            title = chore.title,
                            subtitle = "${chore.description} • Due: ${chore.dueDate}",
                            leadingIcon = statusIcon,
                            iconTint = statusColor,
                            iconBackgroundColor = statusColor.copy(alpha = 0.12f),
                            trailingBadge = chore.status.replace("_", " "),
                            badgeColor = statusColor,
                            showChevron = false,
                            showDivider = index < chores.size - 1,
                            onClick = {
                                val nextStatus = when (chore.status) {
                                    "PENDING" -> "IN_PROGRESS"
                                    "IN_PROGRESS" -> "COMPLETED"
                                    else -> "PENDING"
                                }
                                chores = chores.map {
                                    if (it.id == chore.id) it.copy(status = nextStatus) else it
                                }
                            }
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(110.dp))
            }
        }

        if (showMilkDialog) {
            ModalBottomSheet(
                onDismissRequest = { showMilkDialog = false },
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
                                text = "Quick Milk Entry",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Record measured litres for this shift session",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        PillBadge(
                            text = "Shift Milking",
                            containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                            contentColor = EmeraldPrimary
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                    OutlinedTextField(
                        value = cowTagInput,
                        onValueChange = { cowTagInput = it },
                        label = { Text("Cow Ear Tag *") },
                        placeholder = { Text("e.g. #104 or 104") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = yieldInput,
                        onValueChange = { yieldInput = it },
                        label = { Text("Litres Produced (L) *") },
                        placeholder = { Text("e.g. 14.5") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showMilkDialog = false },
                            modifier = Modifier.weight(1f).height(48.dp),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text("Cancel", fontWeight = FontWeight.SemiBold)
                        }

                        Button(
                            onClick = {
                                val added = yieldInput.toDoubleOrNull() ?: 0.0
                                sessionLitresLogged += added
                                cowTagInput = ""
                                yieldInput = ""
                                showMilkDialog = false
                            },
                            modifier = Modifier.weight(1.5f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Save Entry", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WorkerChoreItem(
    task: FarmTask,
    onStatusCycle: () -> Unit
) {
    val isCompleted = task.status == "COMPLETED"

    val (badgeBg, badgeColor, badgeLabel) = when (task.status) {
        "COMPLETED" -> Triple(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary, "Done")
        "IN_PROGRESS" -> Triple(GoldAmber.copy(alpha = 0.15f), GoldAmber, "In Progress")
        else -> Triple(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant, "Pending")
    }

    val iconTint by animateColorAsState(
        targetValue = when (task.status) {
            "COMPLETED" -> EmeraldPrimary
            "IN_PROGRESS" -> GoldAmber
            else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
        },
        label = "iconTint"
    )

    IslandCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        elevation = if (isCompleted) 1.dp else 3.dp,
        onClick = onStatusCycle
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onStatusCycle,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = when (task.status) {
                        "COMPLETED" -> Icons.Rounded.CheckCircle
                        "IN_PROGRESS" -> Icons.Rounded.Timelapse
                        else -> Icons.Rounded.RadioButtonUnchecked
                    },
                    contentDescription = "Toggle Status",
                    tint = iconTint,
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = task.title,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isCompleted) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        else MaterialTheme.colorScheme.onSurface,
                        textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None
                    )
                    PillBadge(
                        text = badgeLabel,
                        containerColor = badgeBg,
                        contentColor = badgeColor
                    )
                }

                if (task.description.isNotBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = task.description,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        lineHeight = 16.sp
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.Schedule,
                        contentDescription = "Time",
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = task.dueDate,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Worker Dashboard Light")
@Composable
fun WorkerDashboardPreview() {
    FMSTheme(darkTheme = false) {
        WorkerDashboard()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Worker Dashboard Dark")
@Composable
fun WorkerDashboardDarkPreview() {
    FMSTheme(darkTheme = true) {
        WorkerDashboard()
    }
}
