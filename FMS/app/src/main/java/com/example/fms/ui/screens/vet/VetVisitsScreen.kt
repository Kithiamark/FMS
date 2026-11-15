package com.example.fms.ui.screens.vet

import android.content.Intent
import android.net.Uri
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
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

data class MobileVetVisit(
    val id: String,
    val farmName: String,
    val farmerName: String,
    val farmerPhone: String,
    val location: String,
    val scheduledDate: String,
    val visitType: String, // Routine, Emergency, Vaccination, Consultation
    val status: String, // SCHEDULED, COMPLETED, CANCELLED
    val clinicalNotes: String = "",
    val costKes: Int = 2500
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VetVisitsScreen(
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    var selectedFilter by remember { mutableStateOf("ALL") }
    var isCalendarMode by remember { mutableStateOf(false) }

    // Visits List State
    var visits by remember {
        mutableStateOf(
            listOf(
                MobileVetVisit(
                    id = "v_101",
                    farmName = "Baraka Dairy Farm",
                    farmerName = "Mark Kipkorir",
                    farmerPhone = "+254712345678",
                    location = "Eldoret, Chepkoilel Route",
                    scheduledDate = "Today, 02:30 PM",
                    visitType = "Emergency Callout",
                    status = "SCHEDULED",
                    clinicalNotes = "Quarter swelling & acute clinical mastitis examination. Prepare intramammary infusion.",
                    costKes = 3500
                ),
                MobileVetVisit(
                    id = "v_102",
                    farmName = "Highland Pastures",
                    farmerName = "Faith Chepkemoi",
                    farmerPhone = "+254722987654",
                    location = "Kapsabet Road, Farm #4",
                    scheduledDate = "Tomorrow, 09:00 AM",
                    visitType = "Vaccination Drive",
                    status = "SCHEDULED",
                    clinicalNotes = "Annual Foot & Mouth Disease (FMD) booster drive for 24 adult cows.",
                    costKes = 6000
                ),
                MobileVetVisit(
                    id = "v_103",
                    farmName = "Kiprono Meadow Ranch",
                    farmerName = "David Kiprono",
                    farmerPhone = "+254733112233",
                    location = "Nandi Hills Corridor",
                    scheduledDate = "Oct 24, 11:00 AM",
                    visitType = "Routine Herd Check",
                    status = "SCHEDULED",
                    clinicalNotes = "Body condition scoring (BCS) & pregnancy diagnosis (rectal palpation) on 8 heifers.",
                    costKes = 2500
                ),
                MobileVetVisit(
                    id = "v_104",
                    farmName = "Green Valley Homestead",
                    farmerName = "John Mwangi",
                    farmerPhone = "+254701234567",
                    location = "Moiben Junction",
                    scheduledDate = "Oct 18, 08:30 AM",
                    visitType = "Consultation",
                    status = "COMPLETED",
                    clinicalNotes = "Ration balancing & silage pit preservation advisory. Silage quality approved.",
                    costKes = 2000
                )
            )
        )
    }

    // Schedule Visit Form State
    var showScheduleModal by remember { mutableStateOf(false) }
    var selectedFarmName by remember { mutableStateOf("Baraka Dairy Farm") }
    var selectedFarmerName by remember { mutableStateOf("Mark Kipkorir") }
    var selectedFarmerPhone by remember { mutableStateOf("+254712345678") }
    var selectedLocation by remember { mutableStateOf("Eldoret, Chepkoilel Route") }
    var selectedVisitType by remember { mutableStateOf("Routine Herd Check") }
    var selectedDateSlot by remember { mutableStateOf("Tomorrow, 09:00 AM") }
    var visitNotes by remember { mutableStateOf("") }
    var visitCostInput by remember { mutableStateOf("2500") }

    val connectedFarms = listOf(
        Triple("Baraka Dairy Farm", "Mark Kipkorir", "+254712345678"),
        Triple("Highland Pastures", "Faith Chepkemoi", "+254722987654"),
        Triple("Kiprono Meadow Ranch", "David Kiprono", "+254733112233"),
        Triple("Green Valley Homestead", "John Mwangi", "+254701234567")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Veterinary Farm Visits",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "Clinical Schedules & On-Farm Callouts",
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
                    IconButton(onClick = { isCalendarMode = !isCalendarMode }) {
                        Icon(
                            imageVector = if (isCalendarMode) Icons.Rounded.FormatListBulleted else Icons.Rounded.CalendarMonth,
                            contentDescription = "Toggle Calendar",
                            tint = if (isCalendarMode) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = { showScheduleModal = true }) {
                        Icon(
                            imageVector = Icons.Rounded.Add,
                            contentDescription = "Schedule Visit",
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
                onClick = { showScheduleModal = true },
                containerColor = EmeraldPrimary,
                contentColor = Color.White,
                icon = { Icon(Icons.Rounded.Add, contentDescription = null) },
                text = { Text("Schedule Visit", fontWeight = FontWeight.Bold) },
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
            // 1. KPI Metric Summary Cards
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    val scheduledCount = visits.count { it.status == "SCHEDULED" }
                    val emergencyCount = visits.count { it.visitType.contains("Emergency", ignoreCase = true) && it.status == "SCHEDULED" }
                    val completedCount = visits.count { it.status == "COMPLETED" }

                    // Card 1: Upcoming
                    IslandCard(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "SCHEDULED",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$scheduledCount",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = SkyBlue
                            )
                            Text(
                                text = "Visits Pending",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Card 2: Emergencies
                    IslandCard(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "EMERGENCY",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = RoseRed
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$emergencyCount",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = RoseRed
                            )
                            Text(
                                text = "High Priority",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Card 3: Completed
                    IslandCard(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "COMPLETED",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = EmeraldPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$completedCount",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                            Text(
                                text = "Clinical Logs",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // 2. View Mode Switcher / Calendar Agenda Banner
            if (isCalendarMode) {
                item {
                    IslandCard {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.CalendarToday,
                                        contentDescription = null,
                                        tint = EmeraldPrimary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Monthly Clinical Agenda",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                }
                                PillBadge(
                                    text = "OCTOBER 2026",
                                    color = EmeraldPrimary,
                                    backgroundColor = EmeraldLight
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Date chips
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                val dates = listOf(
                                    Pair("19 Oct", "Today (1 visit)"),
                                    Pair("20 Oct", "Tue (1 visit)"),
                                    Pair("22 Oct", "Thu (Free)"),
                                    Pair("24 Oct", "Sat (1 visit)")
                                )
                                items(dates) { (d, label) ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(
                                                if (d.contains("19")) EmeraldPrimary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                            )
                                            .border(
                                                width = 1.dp,
                                                color = if (d.contains("19")) EmeraldPrimary else Color.Transparent,
                                                shape = RoundedCornerShape(10.dp)
                                            )
                                            .padding(horizontal = 12.dp, vertical = 8.dp)
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = d,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (d.contains("19")) EmeraldPrimary else MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = label,
                                                fontSize = 10.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. Category Filter Chips
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val filters = listOf(
                            "ALL" to "All Visits",
                            "SCHEDULED" to "Scheduled",
                            "COMPLETED" to "Completed",
                            "EMERGENCY" to "Emergencies"
                        )
                        items(filters) { (code, label) ->
                            val isSelected = selectedFilter == code
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedFilter = code },
                                label = {
                                    Text(
                                        label,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                    selectedLabelColor = EmeraldPrimary
                                )
                            )
                        }
                    }

                    val count = visits.count {
                        when (selectedFilter) {
                            "SCHEDULED" -> it.status == "SCHEDULED"
                            "COMPLETED" -> it.status == "COMPLETED"
                            "EMERGENCY" -> it.visitType.contains("Emergency", ignoreCase = true)
                            else -> true
                        }
                    }
                    Text(
                        text = "$count visits",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // 4. Visits List
            val filteredVisits = visits.filter {
                when (selectedFilter) {
                    "SCHEDULED" -> it.status == "SCHEDULED"
                    "COMPLETED" -> it.status == "COMPLETED"
                    "EMERGENCY" -> it.visitType.contains("Emergency", ignoreCase = true)
                    else -> true
                }
            }

            if (filteredVisits.isEmpty()) {
                item {
                    IslandCard {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(36.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.MedicalServices,
                                contentDescription = null,
                                tint = EmeraldPrimary,
                                modifier = Modifier.size(44.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No farm visits in this category",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Tap 'Schedule Visit' to dispatch a new farm visit.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(filteredVisits, key = { it.id }) { visit ->
                    val isEmergency = visit.visitType.contains("Emergency", ignoreCase = true)
                    val isCompleted = visit.status == "COMPLETED"

                    IslandCard {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                        ) {
                            // Header Row: Farm Name & Status Badge
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = visit.farmName,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Rounded.LocationOn,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = visit.location,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(8.dp))

                                // Status Badge
                                val (statusColor, statusBg) = when {
                                    isCompleted -> Pair(EmeraldPrimary, EmeraldLight)
                                    isEmergency -> Pair(RoseRed, RoseLight)
                                    else -> Pair(SkyBlue, BlueLight)
                                }
                                PillBadge(
                                    text = if (isEmergency && !isCompleted) "EMERGENCY" else visit.status,
                                    color = statusColor,
                                    backgroundColor = statusBg
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            // Details Pill: Type & Schedule Time
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (isEmergency) Icons.Rounded.Warning else Icons.Rounded.MedicalServices,
                                        contentDescription = null,
                                        tint = if (isEmergency) RoseRed else EmeraldPrimary,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = visit.visitType,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.Schedule,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = visit.scheduledDate,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }

                            // Clinical Notes
                            if (visit.clinicalNotes.isNotBlank()) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = visit.clinicalNotes,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    lineHeight = 17.sp
                                )
                            }

                            // Farmer Contact & Cost
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
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
                                    Text(
                                        text = "${visit.farmerName} (${visit.farmerPhone})",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                Text(
                                    text = "KES ${"%,d".format(visit.costKes)}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = EmeraldPrimary
                                )
                            }

                            // Action Buttons
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(
                                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f),
                                thickness = 1.dp
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Direct Call Button
                                OutlinedButton(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL).apply {
                                            data = Uri.parse("tel:${visit.farmerPhone}")
                                        }
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = PaddingValues(vertical = 8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.Phone,
                                        contentDescription = "Call",
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Call Farmer", fontSize = 12.sp)
                                }

                                // Mark Completed / Action Button
                                if (!isCompleted) {
                                    Button(
                                        onClick = {
                                            visits = visits.map {
                                                if (it.id == visit.id) it.copy(status = "COMPLETED") else it
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.weight(1f),
                                        contentPadding = PaddingValues(vertical = 8.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Rounded.CheckCircle,
                                            contentDescription = null,
                                            modifier = Modifier.size(15.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Mark Done", fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
    // MODAL: SCHEDULE NEW FARM VISIT
    // ==========================================
    if (showScheduleModal) {
        IslandModal(
            isOpen = showScheduleModal,
            onDismissRequest = { showScheduleModal = false },
            title = "Schedule Farm Visit",
            icon = Icons.Rounded.MedicalServices,
            badgeText = "CLINICAL APPOINTMENT",
            confirmButton = {
                Button(
                    onClick = {
                        val newVisit = MobileVetVisit(
                            id = "v_${System.currentTimeMillis()}",
                            farmName = selectedFarmName,
                            farmerName = selectedFarmerName,
                            farmerPhone = selectedFarmerPhone,
                            location = selectedLocation,
                            scheduledDate = selectedDateSlot,
                            visitType = selectedVisitType,
                            status = "SCHEDULED",
                            clinicalNotes = if (visitNotes.isBlank()) "Routine clinical assessment and herd health audit." else visitNotes.trim(),
                            costKes = visitCostInput.toIntOrNull() ?: 2500
                        )
                        visits = listOf(newVisit) + visits
                        visitNotes = ""
                        showScheduleModal = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Confirm Visit", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showScheduleModal = false },
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
                // Target Farm Selector
                Text(
                    text = "Select Connected Farm",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(connectedFarms) { (farm, owner, phone) ->
                        val isSelected = selectedFarmName == farm
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
                                    selectedFarmName = farm
                                    selectedFarmerName = owner
                                    selectedFarmerPhone = phone
                                }
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Column {
                                Text(
                                    text = farm,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = owner,
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                // Visit Type Selector
                Text(
                    text = "Visit Type",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                val visitTypes = listOf(
                    "Routine Herd Check",
                    "Emergency Callout",
                    "Vaccination Drive",
                    "Consultation"
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(visitTypes) { vt ->
                        val isSelected = selectedVisitType == vt
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedVisitType = vt },
                            label = { Text(vt, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = if (vt == "Emergency Callout") RoseRed.copy(alpha = 0.15f) else EmeraldPrimary.copy(alpha = 0.15f),
                                selectedLabelColor = if (vt == "Emergency Callout") RoseRed else EmeraldPrimary
                            )
                        )
                    }
                }

                // Scheduled Date & Time Slot
                Text(
                    text = "Date & Scheduled Slot",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                val slots = listOf(
                    "Today, 04:30 PM",
                    "Tomorrow, 09:00 AM",
                    "Tomorrow, 02:00 PM",
                    "Friday, 10:00 AM"
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(slots) { slot ->
                        val isSelected = selectedDateSlot == slot
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedDateSlot = slot },
                            label = { Text(slot, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                selectedLabelColor = EmeraldPrimary
                            )
                        )
                    }
                }

                // Clinical Notes
                OutlinedTextField(
                    value = visitNotes,
                    onValueChange = { visitNotes = it },
                    label = { Text("Clinical Notes / Prep Instructions") },
                    placeholder = { Text("e.g. Ensure crush pen is clean, prep ultrasound probe...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    shape = RoundedCornerShape(12.dp)
                )

                // Consultation Fee
                OutlinedTextField(
                    value = visitCostInput,
                    onValueChange = { visitCostInput = it },
                    label = { Text("Estimated Fee (KES)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
            }
        }
    }
}

@Preview(name = "VetVisitsScreen Light", showBackground = true)
@Composable
fun VetVisitsScreenLightPreview() {
    FMSTheme(darkTheme = false) {
        VetVisitsScreen()
    }
}

@Preview(name = "VetVisitsScreen Dark", showBackground = true)
@Composable
fun VetVisitsScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        VetVisitsScreen()
    }
}
