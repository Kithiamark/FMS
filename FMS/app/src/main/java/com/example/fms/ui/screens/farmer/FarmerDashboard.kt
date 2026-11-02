package com.example.fms.ui.screens.farmer

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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.DailyMilkSummary
import com.example.fms.data.model.FarmTask
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

@Composable
fun FarmerDashboard(
    onNavigateToRecordMilk: () -> Unit = {},
    onNavigateToAllocation: () -> Unit = {},
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
                FarmTask("1", "Morning Milking Check", "Inspect milk storage cooler temperature", "COMPLETED", "06:30 AM", "Mwangi (Feeder)"),
                FarmTask("2", "Replenish Mineral Lick", "Paddock 2 salt blocks", "PENDING", "11:00 AM", "Kiprono (Milker)"),
                FarmTask("3", "Calf Teat Bucket Cleaning", "Wash buckets with sanitizing solution", "PENDING", "04:30 PM", "Wanjiku (Records)")
            )
        )
    }

    var showAssignTaskModal by remember { mutableStateOf(false) }
    var newTaskTitle by remember { mutableStateOf("") }
    var newTaskDescription by remember { mutableStateOf("") }
    var newTaskAssignee by remember { mutableStateOf("Kiprono (Milker)") }
    var newTaskDue by remember { mutableStateOf("Today, 04:30 PM") }
    var taskError by remember { mutableStateOf(false) }

    var showHerdHealthDialog by remember { mutableStateOf(false) }
    var sessionDialogTitle by remember { mutableStateOf<String?>(null) }
    var sessionDialogDetails by remember { mutableStateOf<String?>(null) }

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
                    title = "Kithia Dairy Farm",
                    subtitle = "Active Enterprise Plan • 24 Cows in Milking",
                    roleBadge = "FARM OWNER"
                )
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }

            // 2. DAILY MILK PRODUCTION & ALLOCATION INSET GROUP
            item {
                InsetGroup(
                    header = "Daily Milk Operations",
                    footer = "Auto-balanced from morning and evening milking sessions."
                ) {
                    InsetRow(
                        title = "Total Production",
                        subtitle = "Today across 24 cows",
                        leadingIcon = Icons.Rounded.WaterDrop,
                        trailingText = "${milkSummary.totalProduced} L",
                        trailingBadge = "100% Balanced",
                        badgeColor = EmeraldPrimary,
                        showChevron = true,
                        onClick = onNavigateToAllocation
                    )
                    InsetRow(
                        title = "Morning Yield",
                        subtitle = "Recorded across 14 lactating cows",
                        leadingIcon = Icons.Rounded.WbSunny,
                        iconTint = GoldAmber,
                        iconBackgroundColor = GoldAmber.copy(alpha = 0.12f),
                        trailingText = "${milkSummary.morningYield} L",
                        showChevron = true,
                        onClick = {
                            sessionDialogTitle = "Morning Milking Session"
                            sessionDialogDetails = "Recorded 72.5L across 14 lactating cows. Cooler chilling temperature stable at 3.8°C. First batch ready for delivery."
                        }
                    )
                    InsetRow(
                        title = "Evening Yield",
                        subtitle = "Recorded across 13 lactating cows",
                        leadingIcon = Icons.Rounded.NightsStay,
                        iconTint = SkyBlue,
                        iconBackgroundColor = SkyBlue.copy(alpha = 0.12f),
                        trailingText = "${milkSummary.eveningYield} L",
                        showChevron = true,
                        onClick = {
                            sessionDialogTitle = "Evening Milking Session"
                            sessionDialogDetails = "Recorded 54.0L across 13 lactating cows. Cow #104 (Bessie) milk held back for mastitis test."
                        }
                    )
                    InsetRow(
                        title = "Milk Allocation",
                        subtitle = "${milkSummary.soldLitres}L sold • ${milkSummary.calvesLitres}L calves",
                        leadingIcon = Icons.Rounded.PieChart,
                        iconTint = ForestGreen,
                        iconBackgroundColor = ForestGreen.copy(alpha = 0.12f),
                        trailingBadge = "Dispatched",
                        badgeColor = ForestGreen,
                        showChevron = true,
                        showDivider = false,
                        onClick = onNavigateToAllocation
                    )
                }
            }

            // 3. QUICK ACTIONS INSET GROUP
            item {
                InsetGroup(
                    header = "Quick Actions"
                ) {
                    InsetRow(
                        title = "Record Milking Yield",
                        subtitle = "Enter morning/evening milk per cow",
                        leadingIcon = Icons.Rounded.AddCircleOutline,
                        iconTint = ForestGreen,
                        iconBackgroundColor = ForestGreen.copy(alpha = 0.12f),
                        showChevron = true,
                        onClick = onNavigateToRecordMilk
                    )
                    InsetRow(
                        title = "Herd Registry",
                        subtitle = "Manage 24 registered cattle & vitals",
                        leadingIcon = com.example.fms.ui.theme.CowIcon,
                        iconTint = SkyBlue,
                        iconBackgroundColor = SkyBlue.copy(alpha = 0.12f),
                        trailingText = "24 Cows",
                        showChevron = true,
                        onClick = onNavigateToHerd
                    )
                    InsetRow(
                        title = "Farm Finance & Expenses",
                        subtitle = "Ledger, feeds, vet bills & revenue",
                        leadingIcon = Icons.AutoMirrored.Rounded.ReceiptLong,
                        iconTint = GoldAmber,
                        iconBackgroundColor = GoldAmber.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = onNavigateToFinance
                    )
                }
            }

            // 4. HERD HEALTH STATUS INSET GROUP
            item {
                InsetGroup(
                    header = "Veterinary & Health"
                ) {
                    InsetRow(
                        title = "Herd Health Status",
                        subtitle = "1 cow due for mastitis check",
                        leadingIcon = Icons.Rounded.HealthAndSafety,
                        iconTint = RoseRed,
                        iconBackgroundColor = RoseRed.copy(alpha = 0.12f),
                        trailingBadge = "Checkup Due",
                        badgeColor = GoldAmber,
                        showChevron = true,
                        showDivider = false,
                        onClick = { showHerdHealthDialog = true }
                    )
                }
            }

            // 5. DAILY FARM CHORES INSET GROUP
            item {
                InsetGroup(
                    header = "Daily Farm Chores (${tasks.count { it.status == "COMPLETED" }}/${tasks.size})",
                    footer = "Tap any chore to mark completed. Dispatch new routines with '+'."
                ) {
                    tasks.forEachIndexed { index, task ->
                        val isDone = task.status == "COMPLETED"
                        InsetRow(
                            title = task.title,
                            subtitle = "${task.description} • Due: ${task.dueDate}",
                            leadingIcon = if (isDone) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                            iconTint = if (isDone) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            iconBackgroundColor = if (isDone) EmeraldPrimary.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            trailingBadge = if (task.assignedTo.isNotBlank()) task.assignedTo else null,
                            badgeColor = EmeraldPrimary,
                            showChevron = false,
                            showDivider = index < tasks.size - 1,
                            onClick = {
                                tasks = tasks.map {
                                    if (it.id == task.id) {
                                        it.copy(status = if (isDone) "PENDING" else "COMPLETED")
                                    } else it
                                }
                            }
                        )
                    }

                    InsetRow(
                        title = "Assign New Chore",
                        subtitle = "Dispatch chore to worker or record keeper",
                        leadingIcon = Icons.Rounded.Add,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = { showAssignTaskModal = true }
                    )
                }
            }
        }

    // Assign Chore Modal
    if (showAssignTaskModal) {
        IslandModal(
            isOpen = showAssignTaskModal,
            onDismissRequest = {
                showAssignTaskModal = false
                taskError = false
            },
            title = "Assign Farm Chore",
            icon = Icons.Rounded.AssignmentTurnedIn,
            badgeText = "TASK DISPATCH",
            confirmButton = {
                Button(
                    onClick = {
                        if (newTaskTitle.isBlank()) {
                            taskError = true
                        } else {
                            val createdTask = FarmTask(
                                id = "t_${System.currentTimeMillis()}",
                                title = newTaskTitle.trim(),
                                description = if (newTaskDescription.isBlank()) "Standard routine" else newTaskDescription.trim(),
                                status = "PENDING",
                                dueDate = newTaskDue,
                                assignedTo = newTaskAssignee
                            )
                            tasks = listOf(createdTask) + tasks
                            newTaskTitle = ""
                            newTaskDescription = ""
                            taskError = false
                            showAssignTaskModal = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Dispatch Chore", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = {
                        showAssignTaskModal = false
                        taskError = false
                    },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Cancel")
                }
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = newTaskTitle,
                    onValueChange = {
                        newTaskTitle = it
                        taskError = false
                    },
                    label = { Text("Chore Title *") },
                    placeholder = { Text("e.g. Slurry scraper cleanout") },
                    singleLine = true,
                    isError = taskError,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = newTaskDescription,
                    onValueChange = { newTaskDescription = it },
                    label = { Text("Instructions / Notes") },
                    placeholder = { Text("e.g. Disinfect stalls 1-12 after scraping") },
                    maxLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Column {
                    Text(
                        text = "Assign Worker",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("Kiprono (Milker)", "Mwangi (Feeder)", "Wanjiku (Records)").forEach { worker ->
                            FilterChip(
                                selected = newTaskAssignee == worker,
                                onClick = { newTaskAssignee = worker },
                                label = { Text(worker, fontSize = 11.sp) },
                                shape = RoundedCornerShape(14.dp),
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = EmeraldPrimary.copy(alpha = 0.2f),
                                    selectedLabelColor = EmeraldPrimary
                                )
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = newTaskDue,
                    onValueChange = { newTaskDue = it },
                    label = { Text("Target Due Time") },
                    placeholder = { Text("e.g. Today, 04:30 PM") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                if (taskError) {
                    Text(
                        text = "Please enter a chore title.",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }

    if (showHerdHealthDialog) {
        IslandModal(
            isOpen = showHerdHealthDialog,
            onDismissRequest = { showHerdHealthDialog = false },
            title = "Herd Health Alert",
            icon = Icons.Rounded.HealthAndSafety,
            badgeText = "VET ACTION REQUIRED",
            confirmButton = {
                Button(
                    onClick = {
                        showHerdHealthDialog = false
                        onNavigateToHerd()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("View Herd Profile", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showHerdHealthDialog = false }) {
                    Text("Dismiss")
                }
            }
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = AmberLight.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "COW-#104 (Bessie) • Quarter Swelling",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Rear-right teat inflammation detected during morning milking. Yield decreased by 40%. Milk excluded from bulk collection.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    if (sessionDialogTitle != null) {
        IslandModal(
            isOpen = true,
            onDismissRequest = { sessionDialogTitle = null; sessionDialogDetails = null },
            title = sessionDialogTitle ?: "Milking Session",
            icon = Icons.Rounded.Opacity,
            badgeText = "SESSION LOG",
            confirmButton = {
                Button(
                    onClick = {
                        sessionDialogTitle = null
                        sessionDialogDetails = null
                        onNavigateToRecordMilk()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                ) {
                    Text("Add Milking Record", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { sessionDialogTitle = null; sessionDialogDetails = null }) {
                    Text("Close")
                }
            }
        ) {
            Text(
                text = sessionDialogDetails ?: "",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurface,
                lineHeight = 18.sp
            )
        }
    }
}
}

@Composable
fun MetricPill(
    label: String,
    value: String,
    color: Color,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        color = Color.Transparent,
        modifier = modifier
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(3.dp),
            modifier = Modifier.padding(vertical = 4.dp, horizontal = 2.dp)
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
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Ellipsis
            )
        }
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
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Ellipsis
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
