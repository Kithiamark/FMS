package com.example.fms.ui.screens.worker

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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

// Data model for Personal To-Do item
data class PersonalTodoItem(
    val id: String,
    val title: String,
    val isCompleted: Boolean = false,
    val createdAt: String = "Today",
    val category: String = "Routine"
)

// Data model for Enterprise Worker Task
data class EnterpriseChoreItem(
    val id: String,
    val title: String,
    val description: String,
    val assignedTo: String,
    val roleBadge: String,
    val dueDate: String,
    val status: String, // PENDING, IN_PROGRESS, COMPLETED
    val priority: String = "NORMAL" // URGENT, HIGH, NORMAL
)

enum class TasksViewMode {
    MY_TODO,
    WORKER_CHORES
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerTasksScreen(
    onBackClick: () -> Unit = {},
    isEnterpriseUser: Boolean = true,
    userRole: String = "FARMER" // FARMER, FARM_WORKER, ADMIN
) {
    var viewMode by remember { mutableStateOf(TasksViewMode.MY_TODO) }

    // --- State for Personal To-Dos ---
    var personalTodos by remember {
        mutableStateOf(
            listOf(
                PersonalTodoItem("td_1", "Morning herd milking check & milk storage cooler temp check", true, "Today 06:15 AM", "Milking"),
                PersonalTodoItem("td_2", "Replenish mineral salt licks in paddock 2", false, "Today 09:30 AM", "Nutrition"),
                PersonalTodoItem("td_3", "Check calf water troughs & clean bucket feeding teats", false, "Today 11:00 AM", "Calf Care"),
                PersonalTodoItem("td_4", "Inspect Cow #104 antibiotic withdrawal holding pen", false, "Today 02:00 PM", "Vet Isolation"),
                PersonalTodoItem("td_5", "Order 10 bags 16% dairy meal concentrate from agrovet", true, "Yesterday", "Supplies")
            )
        )
    }
    var newTodoText by remember { mutableStateOf("") }
    var todoFilter by remember { mutableStateOf("ALL") } // ALL, ACTIVE, COMPLETED

    // --- State for Enterprise Worker Chores ---
    var workerChores by remember {
        mutableStateOf(
            listOf(
                EnterpriseChoreItem(
                    id = "c_101",
                    title = "Slurry Pit Flush & Stall Sanitization",
                    description = "Power-wash concrete barn alleys 1-12 and flush slurry channels before midday milking.",
                    assignedTo = "Mwangi Njoroge",
                    roleBadge = "Milker & Barn Ops",
                    dueDate = "Today, 11:30 AM",
                    status = "IN_PROGRESS",
                    priority = "HIGH"
                ),
                EnterpriseChoreItem(
                    id = "c_102",
                    title = "Haylage Bales Distribution - Paddock 4",
                    description = "Distribute 4 bales of Rhodes grass hay and 300kg maize silage to dry cows.",
                    assignedTo = "Kiprono Langat",
                    roleBadge = "Feeder",
                    dueDate = "Today, 02:00 PM",
                    status = "PENDING",
                    priority = "NORMAL"
                ),
                EnterpriseChoreItem(
                    id = "c_103",
                    title = "Evening Milk Chiller Log & CMT Test",
                    description = "Perform California Mastitis Test on Cow #112 and record cooler vat dipstick volume.",
                    assignedTo = "Wanjiku Kamau",
                    roleBadge = "Quality Controller",
                    dueDate = "Today, 05:30 PM",
                    status = "PENDING",
                    priority = "URGENT"
                ),
                EnterpriseChoreItem(
                    id = "c_104",
                    title = "Morning Milk Batch Delivery to Brookside",
                    description = "Oversee driver loading of 120L chilled bulk milk cans and collect weighbridge ticket.",
                    assignedTo = "Mwangi Njoroge",
                    roleBadge = "Milker & Barn Ops",
                    dueDate = "Today, 07:45 AM",
                    status = "COMPLETED",
                    priority = "NORMAL"
                )
            )
        )
    }
    var choreFilter by remember { mutableStateOf("ALL") } // ALL, PENDING, IN_PROGRESS, COMPLETED

    // Modals
    var showAssignModal by remember { mutableStateOf(false) }
    var choreToDelete by remember { mutableStateOf<EnterpriseChoreItem?>(null) }

    // Assign Task Form State
    var newChoreTitle by remember { mutableStateOf("") }
    var newChoreDescription by remember { mutableStateOf("") }
    var newChoreAssignee by remember { mutableStateOf("Mwangi Njoroge") }
    var newChoreRole by remember { mutableStateOf("Milker & Barn Ops") }
    var newChoreDue by remember { mutableStateOf("Today, 04:30 PM") }
    var newChorePriority by remember { mutableStateOf("NORMAL") }
    var choreFormError by remember { mutableStateOf(false) }

    val availableWorkers = listOf(
        Pair("Mwangi Njoroge", "Milker & Barn Ops"),
        Pair("Kiprono Langat", "Feeder"),
        Pair("Wanjiku Kamau", "Quality Controller"),
        Pair("Juma Otieno", "Field Hand")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (viewMode == TasksViewMode.MY_TODO) "Farm To-Do Checklist" else "Daily Tasks & Worker Chores",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = if (viewMode == TasksViewMode.MY_TODO) "Personal farm routines & reminders" else "Multi-worker chore dispatch & tracking",
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
                    if (viewMode == TasksViewMode.WORKER_CHORES && userRole != "FARM_WORKER") {
                        IconButton(onClick = { showAssignModal = true }) {
                            Icon(
                                imageVector = Icons.Rounded.PersonAdd,
                                contentDescription = "Assign Task",
                                tint = EmeraldPrimary
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            if (viewMode == TasksViewMode.WORKER_CHORES && userRole != "FARM_WORKER") {
                ExtendedFloatingActionButton(
                    onClick = { showAssignModal = true },
                    containerColor = EmeraldPrimary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.Add, contentDescription = null) },
                    text = { Text("Assign Task", fontWeight = FontWeight.Bold) },
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(bottom = 70.dp)
                )
            }
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
            // 1. Dual Mode Segmented Tab Switcher (My To-Do vs Worker Chores)
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Tab 1: My To-Do
                    val isTodoActive = viewMode == TasksViewMode.MY_TODO
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (isTodoActive) MaterialTheme.colorScheme.surface else Color.Transparent
                            )
                            .clickable { viewMode = TasksViewMode.MY_TODO }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Checklist,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (isTodoActive) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "My To-Do",
                                fontSize = 13.sp,
                                fontWeight = if (isTodoActive) FontWeight.Bold else FontWeight.Medium,
                                color = if (isTodoActive) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Tab 2: Worker Chores
                    val isWorkerActive = viewMode == TasksViewMode.WORKER_CHORES
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (isWorkerActive) MaterialTheme.colorScheme.surface else Color.Transparent
                            )
                            .clickable { viewMode = TasksViewMode.WORKER_CHORES }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Group,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (isWorkerActive) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Worker Chores",
                                fontSize = 13.sp,
                                fontWeight = if (isWorkerActive) FontWeight.Bold else FontWeight.Medium,
                                color = if (isWorkerActive) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            PillBadge(
                                text = "ENT",
                                color = GoldAmber,
                                backgroundColor = AmberLight
                            )
                        }
                    }
                }
            }

            // ==========================================
            // VIEW 1: PERSONAL FARM TO-DO LIST
            // ==========================================
            if (viewMode == TasksViewMode.MY_TODO) {
                // Progress KPI Summary
                item {
                    val totalCount = personalTodos.size
                    val completedCount = personalTodos.count { it.isCompleted }
                    val percent = if (totalCount > 0) (completedCount * 100) / totalCount else 0

                    IslandCard {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Column 1: Total
                            Column {
                                Text(
                                    text = "TOTAL CHORES",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "$totalCount",
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            // Divider
                            Box(
                                modifier = Modifier
                                    .height(36.dp)
                                    .width(1.dp)
                                    .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                            )

                            // Column 2: Completed
                            Column {
                                Text(
                                    text = "COMPLETED",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = EmeraldPrimary
                                )
                                Text(
                                    text = "$completedCount",
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary
                                )
                            }

                            // Divider
                            Box(
                                modifier = Modifier
                                    .height(36.dp)
                                    .width(1.dp)
                                    .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                            )

                            // Column 3: Rate
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "PROGRESS",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "$percent%",
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }

                        // Progress Bar
                        LinearProgressIndicator(
                            progress = { if (totalCount > 0) completedCount.toFloat() / totalCount else 0f },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp),
                            color = EmeraldPrimary,
                            trackColor = EmeraldLight.copy(alpha = 0.4f)
                        )
                    }
                }

                // Quick Add To-Do Field
                item {
                    IslandCard {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = newTodoText,
                                    onValueChange = { newTodoText = it },
                                    placeholder = {
                                        Text(
                                            "Add personal chore (e.g. Call vet for deworming)...",
                                            fontSize = 13.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                                        )
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(12.dp),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = EmeraldPrimary,
                                        unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                                    )
                                )

                                Spacer(modifier = Modifier.width(8.dp))

                                Button(
                                    onClick = {
                                        if (newTodoText.isNotBlank()) {
                                            val item = PersonalTodoItem(
                                                id = "td_${System.currentTimeMillis()}",
                                                title = newTodoText.trim(),
                                                isCompleted = false,
                                                createdAt = "Just now",
                                                category = "Routine"
                                            )
                                            personalTodos = listOf(item) + personalTodos
                                            newTodoText = ""
                                        }
                                    },
                                    enabled = newTodoText.isNotBlank(),
                                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                    shape = RoundedCornerShape(12.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp)
                                ) {
                                    Icon(Icons.Rounded.Add, contentDescription = "Add", modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Add", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }

                            // Quick suggestion chips
                            Spacer(modifier = Modifier.height(10.dp))
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                val suggestions = listOf(
                                    "Check cooler temp",
                                    "Replenish salt licks",
                                    "Clean water troughs",
                                    "Order dairy meal",
                                    "Examine calf teats"
                                )
                                items(suggestions) { tag ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                                            .clickable {
                                                newTodoText = tag
                                            }
                                            .padding(horizontal = 10.dp, vertical = 5.dp)
                                    ) {
                                        Text(
                                            text = "+ $tag",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Filter Row
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("ALL" to "All", "ACTIVE" to "Active", "COMPLETED" to "Completed").forEach { (code, label) ->
                                val isSelected = todoFilter == code
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { todoFilter = code },
                                    label = { Text(label, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                        selectedLabelColor = EmeraldPrimary
                                    )
                                )
                            }
                        }

                        val visibleCount = personalTodos.count {
                            when (todoFilter) {
                                "ACTIVE" -> !it.isCompleted
                                "COMPLETED" -> it.isCompleted
                                else -> true
                            }
                        }
                        Text(
                            text = "$visibleCount tasks",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // To-Do Checklist Items
                val filteredTodos = personalTodos.filter {
                    when (todoFilter) {
                        "ACTIVE" -> !it.isCompleted
                        "COMPLETED" -> it.isCompleted
                        else -> true
                    }
                }

                if (filteredTodos.isEmpty()) {
                    item {
                        IslandCard {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.TaskAlt,
                                    contentDescription = null,
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(44.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = if (todoFilter == "ACTIVE") "All caught up!" else "No chores found",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                                Text(
                                    text = if (todoFilter == "ACTIVE") "You have completed all active farm chores for now." else "Add a routine chore above to get started.",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    items(filteredTodos, key = { it.id }) { todo ->
                        IslandCard {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        personalTodos = personalTodos.map {
                                            if (it.id == todo.id) it.copy(isCompleted = !it.isCompleted) else it
                                        }
                                    }
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Checkbox Circle
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (todo.isCompleted) EmeraldPrimary else Color.Transparent
                                        )
                                        .border(
                                            width = 1.5.dp,
                                            color = if (todo.isCompleted) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant,
                                            shape = CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (todo.isCompleted) {
                                        Icon(
                                            imageVector = Icons.Rounded.Check,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = todo.title,
                                        fontSize = 14.sp,
                                        fontWeight = if (todo.isCompleted) FontWeight.Normal else FontWeight.SemiBold,
                                        color = if (todo.isCompleted) MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f) else MaterialTheme.colorScheme.onSurface,
                                        textDecoration = if (todo.isCompleted) TextDecoration.LineThrough else TextDecoration.None
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = todo.createdAt,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        PillBadge(
                                            text = todo.category,
                                            color = if (todo.isCompleted) MaterialTheme.colorScheme.onSurfaceVariant else EmeraldPrimary,
                                            backgroundColor = if (todo.isCompleted) MaterialTheme.colorScheme.surfaceVariant else EmeraldLight
                                        )
                                    }
                                }

                                // Delete Button
                                IconButton(
                                    onClick = {
                                        personalTodos = personalTodos.filter { it.id != todo.id }
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.DeleteOutline,
                                        contentDescription = "Delete",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // ==========================================
            // VIEW 2: ENTERPRISE WORKER CHORES
            // ==========================================
            if (viewMode == TasksViewMode.WORKER_CHORES) {
                // Enterprise Banner
                item {
                    IslandCard {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    Brush.horizontalGradient(
                                        colors = listOf(
                                            Color(0xFFFFFBEB),
                                            Color(0xFFFEF3C7)
                                        )
                                    )
                                )
                                .padding(16.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(GoldAmber.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.WorkspacePremium,
                                        contentDescription = null,
                                        tint = GoldAmber,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(
                                            text = "Enterprise Multi-Worker Dispatch",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            color = Color(0xFF78350F)
                                        )
                                        PillBadge(
                                            text = "ENTERPRISE",
                                            color = GoldAmber,
                                            backgroundColor = Color(0xFFFDE68A)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Assign shift duties, enforce accountability, and receive real-time completion timestamps across all farm workers.",
                                        fontSize = 12.sp,
                                        color = Color(0xFF92400E),
                                        lineHeight = 16.sp
                                    )
                                }
                            }
                        }
                    }
                }

                // Filter Row for Chores
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            val choreFilters = listOf(
                                "ALL" to "All",
                                "PENDING" to "Pending",
                                "IN_PROGRESS" to "In Progress",
                                "COMPLETED" to "Completed"
                            )
                            items(choreFilters) { (code, label) ->
                                val isSelected = choreFilter == code
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { choreFilter = code },
                                    label = { Text(label, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                        selectedLabelColor = EmeraldPrimary
                                    )
                                )
                            }
                        }

                        val choreCount = workerChores.count {
                            if (choreFilter == "ALL") true else it.status == choreFilter
                        }
                        Text(
                            text = "$choreCount chores",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Worker Chores List
                val filteredChores = workerChores.filter {
                    if (choreFilter == "ALL") true else it.status == choreFilter
                }

                if (filteredChores.isEmpty()) {
                    item {
                        IslandCard {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.AssignmentTurnedIn,
                                    contentDescription = null,
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(44.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "No worker chores in this category",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                                Text(
                                    text = "Tap 'Assign Task' to dispatch new duties to farm hands.",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    items(filteredChores, key = { it.id }) { chore ->
                        IslandCard {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                            ) {
                                // Header: Title & Priority
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = chore.title,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = chore.description,
                                            fontSize = 13.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            lineHeight = 17.sp
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    // Status Badge
                                    val (statusColor, statusBg) = when (chore.status) {
                                        "COMPLETED" -> Pair(EmeraldPrimary, EmeraldLight)
                                        "IN_PROGRESS" -> Pair(SkyBlue, BlueLight)
                                        else -> Pair(GoldAmber, AmberLight)
                                    }
                                    PillBadge(
                                        text = chore.status.replace("_", " "),
                                        color = statusColor,
                                        backgroundColor = statusBg
                                    )
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Metadata Row: Assignee & Due Date
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    // Assignee
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(24.dp)
                                                .clip(CircleShape)
                                                .background(EmeraldPrimary.copy(alpha = 0.12f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Rounded.Person,
                                                contentDescription = null,
                                                tint = EmeraldPrimary,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Column {
                                            Text(
                                                text = chore.assignedTo,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = chore.roleBadge,
                                                fontSize = 10.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }

                                    // Due Date
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Rounded.Schedule,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = chore.dueDate,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }

                                // Action Buttons Row
                                Spacer(modifier = Modifier.height(12.dp))
                                HorizontalDivider(
                                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f),
                                    thickness = 1.dp
                                )
                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (chore.status == "PENDING") {
                                        Button(
                                            onClick = {
                                                workerChores = workerChores.map {
                                                    if (it.id == chore.id) it.copy(status = "IN_PROGRESS") else it
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = SkyBlue),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f),
                                            contentPadding = PaddingValues(vertical = 8.dp)
                                        ) {
                                            Icon(Icons.Rounded.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Start Chore", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    if (chore.status != "COMPLETED") {
                                        Button(
                                            onClick = {
                                                workerChores = workerChores.map {
                                                    if (it.id == chore.id) it.copy(status = "COMPLETED") else it
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f),
                                            contentPadding = PaddingValues(vertical = 8.dp)
                                        ) {
                                            Icon(Icons.Rounded.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Mark Done", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    if (userRole != "FARM_WORKER") {
                                        IconButton(
                                            onClick = { choreToDelete = chore },
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Rounded.DeleteOutline,
                                                contentDescription = "Delete",
                                                tint = RoseRed,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ==========================================
    // MODAL 1: ASSIGN NEW WORKER TASK
    // ==========================================
    if (showAssignModal) {
        IslandModal(
            isOpen = showAssignModal,
            onDismissRequest = {
                showAssignModal = false
                choreFormError = false
            },
            title = "Assign Worker Chore",
            icon = Icons.Rounded.PersonAdd,
            badgeText = "ENTERPRISE DISPATCH",
            confirmButton = {
                Button(
                    onClick = {
                        if (newChoreTitle.isBlank()) {
                            choreFormError = true
                        } else {
                            val newChore = EnterpriseChoreItem(
                                id = "c_${System.currentTimeMillis()}",
                                title = newChoreTitle.trim(),
                                description = if (newChoreDescription.isBlank()) "Standard operational shift chore." else newChoreDescription.trim(),
                                assignedTo = newChoreAssignee,
                                roleBadge = newChoreRole,
                                dueDate = newChoreDue,
                                status = "PENDING",
                                priority = newChorePriority
                            )
                            workerChores = listOf(newChore) + workerChores
                            newChoreTitle = ""
                            newChoreDescription = ""
                            choreFormError = false
                            showAssignModal = false
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
                        showAssignModal = false
                        choreFormError = false
                    },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Cancel")
                }
            }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Task Title
                OutlinedTextField(
                    value = newChoreTitle,
                    onValueChange = {
                        newChoreTitle = it
                        if (choreFormError) choreFormError = false
                    },
                    label = { Text("Chore Title *") },
                    placeholder = { Text("e.g. Afternoon Milking - Pen B") },
                    isError = choreFormError,
                    supportingText = if (choreFormError) {
                        { Text("Title is required", color = MaterialTheme.colorScheme.error) }
                    } else null,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                // Instructions / Description
                OutlinedTextField(
                    value = newChoreDescription,
                    onValueChange = { newChoreDescription = it },
                    label = { Text("Instructions / SOP Details") },
                    placeholder = { Text("e.g. Sanitize cluster cups, test CMT, record liters in cooler...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    shape = RoundedCornerShape(12.dp)
                )

                // Assign Worker Picker
                Text(
                    text = "Assign To Worker",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(availableWorkers) { (name, role) ->
                        val isSelected = newChoreAssignee == name
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isSelected) EmeraldPrimary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                )
                                .border(
                                    width = 1.dp,
                                    color = if (isSelected) EmeraldPrimary else Color.Transparent,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable {
                                    newChoreAssignee = name
                                    newChoreRole = role
                                }
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Column {
                                Text(
                                    text = name,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = role,
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                // Due Time Shift Picker
                Text(
                    text = "Shift / Due Time",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                val shifts = listOf(
                    "Today, 06:30 AM (Morning)",
                    "Today, 12:00 PM (Midday)",
                    "Today, 04:30 PM (Evening)",
                    "Tomorrow, 06:30 AM"
                )
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(shifts) { shift ->
                        val isSelected = newChoreDue == shift
                        FilterChip(
                            selected = isSelected,
                            onClick = { newChoreDue = shift },
                            label = { Text(shift, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                selectedLabelColor = EmeraldPrimary
                            )
                        )
                    }
                }
            }
        }
    }

    // ==========================================
    // MODAL 2: DELETE CONFIRMATION
    // ==========================================
    if (choreToDelete != null) {
        IslandModal(
            isOpen = choreToDelete != null,
            onDismissRequest = { choreToDelete = null },
            title = "Delete Chore",
            icon = Icons.Rounded.DeleteForever,
            badgeText = "CONFIRMATION",
            confirmButton = {
                Button(
                    onClick = {
                        workerChores = workerChores.filter { it.id != choreToDelete?.id }
                        choreToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseRed),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Delete Chore", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { choreToDelete = null },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Cancel")
                }
            }
        ) {
            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                Text(
                    text = "Are you sure you want to remove this assigned task?",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "\"${choreToDelete?.title}\"",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Assigned to ${choreToDelete?.assignedTo}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Preview(name = "WorkerTasksScreen Light", showBackground = true)
@Composable
fun WorkerTasksScreenLightPreview() {
    FMSTheme(darkTheme = false) {
        WorkerTasksScreen()
    }
}

@Preview(name = "WorkerTasksScreen Dark", showBackground = true)
@Composable
fun WorkerTasksScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        WorkerTasksScreen()
    }
}
