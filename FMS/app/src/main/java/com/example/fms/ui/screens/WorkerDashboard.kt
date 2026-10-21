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
import com.example.fms.ui.components.HeroHeader
import com.example.fms.ui.components.IslandCard
import com.example.fms.ui.components.PillBadge
import com.example.fms.ui.theme.*

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

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // 1. Hero Island
        item {
            HeroHeader(
                title = "Farm Operations",
                subtitle = "Assigned to Barn Alpha • Morning & Midday Shift",
                roleBadge = "Field Worker",
                onNotificationClick = {}
            )
        }

        // 2. Overlapping Shift Progress Island
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-28).dp)
                    .padding(horizontal = 16.dp)
            ) {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 6.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "SHIFT PROGRESS",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$completedCount of ${chores.size} Chores Done",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        PillBadge(
                            text = "${(progress * 100).toInt()}%",
                            containerColor = if (progress >= 1f) EmeraldPrimary.copy(alpha = 0.2f) else SkyBlue.copy(alpha = 0.2f),
                            contentColor = if (progress >= 1f) EmeraldPrimary else SkyBlue
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = EmeraldPrimary,
                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(EmeraldPrimary)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "$completedCount Done",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(GoldAmber)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "${chores.count { it.status == "IN_PROGRESS" }} In Progress",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "${chores.count { it.status == "PENDING" }} Pending",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            }
        }

        // 3. Quick Milking Session Island
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-16).dp)
                    .padding(horizontal = 16.dp)
            ) {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 4.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(EmeraldPrimary.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.WaterDrop,
                                    contentDescription = "Milking Session",
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(26.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(
                                    text = "Milking Session Active",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Logged: ${"%.1f".format(sessionLitresLogged)} L recorded today",
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        }

                        Button(
                            onClick = { showMilkDialog = true },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                        ) {
                            Icon(Icons.Rounded.Add, contentDescription = "Add", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "Log Cow", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // 4. Role Safeguard Notice Island
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-8).dp)
                    .padding(horizontal = 16.dp)
            ) {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                    borderColor = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f),
                    elevation = 1.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Security,
                            contentDescription = "Safeguard",
                            tint = SkyBlue,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Worker mode: Milk entries require OTP authorization from farm manager for edits or deletions.",
                            fontSize = 12.sp,
                            lineHeight = 16.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
            }
        }

        // 5. Section Title: Chores & Tasks
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Shift Chores",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Tap circle to cycle status",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
        }

        // 6. Chores Interactive List
        items(chores) { chore ->
            WorkerChoreItem(
                task = chore,
                onStatusCycle = {
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
            Spacer(modifier = Modifier.height(10.dp))
        }

        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }

    if (showMilkDialog) {
        AlertDialog(
            onDismissRequest = { showMilkDialog = false },
            title = {
                Text(
                    text = "Log Cow Milk Yield",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Enter individual cow ear tag and measured litres for this shift session.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    OutlinedTextField(
                        value = cowTagInput,
                        onValueChange = { cowTagInput = it },
                        label = { Text("Cow Ear Tag (e.g. #204)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = yieldInput,
                        onValueChange = { yieldInput = it },
                        label = { Text("Litres Produced (e.g. 14.5)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val added = yieldInput.toDoubleOrNull() ?: 0.0
                        sessionLitresLogged += added
                        cowTagInput = ""
                        yieldInput = ""
                        showMilkDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Save Entry")
                }
            },
            dismissButton = {
                TextButton(onClick = { showMilkDialog = false }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
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
