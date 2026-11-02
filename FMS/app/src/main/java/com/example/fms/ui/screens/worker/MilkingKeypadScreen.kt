package com.example.fms.ui.screens.worker

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.lazy.LazyRow
import com.example.fms.data.model.CattleRecord
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class RecentMilkingEntry(
    val id: String,
    val cowTag: String,
    val litres: Double,
    val time: String,
    val isMorning: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MilkingKeypadScreen(
    onBackClick: () -> Unit = {}
) {
    var earTagInput by remember { mutableStateOf("") }
    var yieldInput by remember { mutableStateOf("") }
    var isEnteringTag by remember { mutableStateOf(true) } // true: selecting/typing ear tag, false: typing yield
    var isMorningShift by remember { mutableStateOf(true) }
    var isKeypadMinimized by remember { mutableStateOf(false) }
    var entryToEdit by remember { mutableStateOf<RecentMilkingEntry?>(null) }
    var editLitresInput by remember { mutableStateOf("") }
    var editOtpInput by remember { mutableStateOf("") }
    var isOtpVerified by remember { mutableStateOf(false) }
    var editError by remember { mutableStateOf(false) }

    val availableCows = remember {
        listOf(
            CattleRecord("1", "#104", "Bessie", "Friesian", "Healthy", 24.5),
            CattleRecord("2", "#108", "Daisy", "Ayrshire", "Healthy", 21.0),
            CattleRecord("3", "#112", "Bella", "Jersey", "Healthy", 18.5),
            CattleRecord("4", "#115", "Luna", "Friesian", "Healthy", 26.0),
            CattleRecord("5", "#120", "Rosie", "Guernsey", "Healthy", 19.0),
            CattleRecord("6", "#124", "Molly", "Ayrshire", "Healthy", 22.5)
        )
    }
    var selectedCow by remember { mutableStateOf<CattleRecord?>(null) }

    var recentLogs by remember {
        mutableStateOf(
            listOf(
                RecentMilkingEntry("1", "#104 (Bessie)", 14.5, "06:42 AM", true),
                RecentMilkingEntry("2", "#108 (Daisy)", 18.0, "06:50 AM", true),
                RecentMilkingEntry("3", "#112 (Bella)", 12.0, "06:58 AM", true)
            )
        )
    }

    val totalLoggedThisSession = recentLogs.sumOf { it.litres }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Milking Parlor Keypad",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isMorningShift) "Morning Milking Shift" else "Evening Milking Shift",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    PillBadge(
                        text = "${"%.1f".format(totalLoggedThisSession)} L",
                        containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                        contentColor = EmeraldPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Shift Switcher Pill
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    .padding(4.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (isMorningShift) MaterialTheme.colorScheme.surface else Color.Transparent,
                    shadowElevation = if (isMorningShift) 2.dp else 0.dp,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { isMorningShift = true }
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Rounded.WbSunny, contentDescription = null, tint = SkyBlue, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Morning Shift",
                            fontSize = 13.sp,
                            fontWeight = if (isMorningShift) FontWeight.Bold else FontWeight.Medium,
                            color = if (isMorningShift) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (!isMorningShift) MaterialTheme.colorScheme.surface else Color.Transparent,
                    shadowElevation = if (!isMorningShift) 2.dp else 0.dp,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { isMorningShift = false }
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Rounded.NightsStay, contentDescription = null, tint = GoldAmber, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Evening Shift",
                            fontSize = 13.sp,
                            fontWeight = if (!isMorningShift) FontWeight.Bold else FontWeight.Medium,
                            color = if (!isMorningShift) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Quick Cow Selection Chips by Name
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SELECT COW BY NAME",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 0.5.sp
                    )
                    if (selectedCow != null) {
                        Text(
                            text = "Clear",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = ForestGreen,
                            modifier = Modifier.clickable {
                                selectedCow = null
                                earTagInput = ""
                                isEnteringTag = true
                            }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(vertical = 2.dp)
                ) {
                    items(availableCows) { cow ->
                        val isSelected = selectedCow?.id == cow.id
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) EmeraldPrimary.copy(alpha = 0.18f) else MaterialTheme.colorScheme.surface,
                            border = BorderStroke(
                                width = if (isSelected) 1.5.dp else 1.dp,
                                color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                            ),
                            modifier = Modifier.clickable {
                                selectedCow = cow
                                earTagInput = cow.tagNumber.removePrefix("#")
                                isEnteringTag = false // Auto-focus yield entry for ultra fast keypad entry
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant)
                                )
                                Column {
                                    Text(
                                        text = cow.name,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = cow.tagNumber,
                                        fontSize = 10.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Dual Active Display Island (Ear Tag & Yield) + Minimize Toggle
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp),
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (isKeypadMinimized) "MILKING KEYPAD (MINIMIZED)" else "ACTIVE MEASUREMENT",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            letterSpacing = 0.5.sp
                        )

                        TextButton(
                            onClick = { isKeypadMinimized = !isKeypadMinimized },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Icon(
                                imageVector = if (isKeypadMinimized) Icons.Rounded.KeyboardArrowDown else Icons.Rounded.KeyboardArrowUp,
                                contentDescription = null,
                                tint = EmeraldPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (isKeypadMinimized) "Show Keypad" else "Minimize",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Ear Tag Display Cell
                        Surface(
                            modifier = Modifier
                                .weight(1.2f)
                                .height(72.dp)
                                .clickable {
                                    isEnteringTag = true
                                    isKeypadMinimized = false
                                },
                            shape = RoundedCornerShape(16.dp),
                            color = if (isEnteringTag) EmeraldPrimary.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            border = androidx.compose.foundation.BorderStroke(
                                width = if (isEnteringTag) 1.5.dp else 0.dp,
                                color = if (isEnteringTag) EmeraldPrimary else Color.Transparent
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(10.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "COW TAG #",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isEnteringTag) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (selectedCow != null) {
                                        PillBadge(
                                            text = selectedCow!!.name,
                                            containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                            contentColor = EmeraldPrimary
                                        )
                                    }
                                }
                                Text(
                                    text = if (earTagInput.isEmpty()) "#---" else "#$earTagInput",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }

                        // Litres Display Cell
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .height(72.dp)
                                .clickable {
                                    isEnteringTag = false
                                    isKeypadMinimized = false
                                },
                            shape = RoundedCornerShape(16.dp),
                            color = if (!isEnteringTag) EmeraldPrimary.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            border = androidx.compose.foundation.BorderStroke(
                                width = if (!isEnteringTag) 1.5.dp else 0.dp,
                                color = if (!isEnteringTag) EmeraldPrimary else Color.Transparent
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(10.dp),
                                verticalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "YIELD (L)",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (!isEnteringTag) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = if (yieldInput.isEmpty()) "0.0 L" else "$yieldInput L",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }

            // Minimizable Tactile Numpad
            AnimatedVisibility(
                visible = !isKeypadMinimized,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(22.dp),
                    color = MaterialTheme.colorScheme.surface,
                    shadowElevation = 3.dp
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        NumpadRow(listOf("1", "2", "3")) { digit ->
                            if (isEnteringTag) earTagInput += digit else yieldInput += digit
                        }
                        NumpadRow(listOf("4", "5", "6")) { digit ->
                            if (isEnteringTag) earTagInput += digit else yieldInput += digit
                        }
                        NumpadRow(listOf("7", "8", "9")) { digit ->
                            if (isEnteringTag) earTagInput += digit else yieldInput += digit
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            NumpadKey(text = ".", modifier = Modifier.weight(1f)) {
                                if (!isEnteringTag && !yieldInput.contains(".")) {
                                    yieldInput += if (yieldInput.isEmpty()) "0." else "."
                                }
                            }
                            NumpadKey(text = "0", modifier = Modifier.weight(1f)) {
                                if (isEnteringTag) earTagInput += "0" else yieldInput += "0"
                            }
                            // Backspace Key
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                                    .clickable {
                                        if (isEnteringTag) {
                                            if (earTagInput.isNotEmpty()) earTagInput = earTagInput.dropLast(1)
                                        } else {
                                            if (yieldInput.isNotEmpty()) yieldInput = yieldInput.dropLast(1)
                                        }
                                    },
                                shape = RoundedCornerShape(14.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Rounded.Backspace, contentDescription = "Delete", tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(18.dp))
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(2.dp))

                        // Commit Button
                        Button(
                            onClick = {
                                if (isEnteringTag) {
                                    isEnteringTag = false
                                } else {
                                    val litres = yieldInput.toDoubleOrNull() ?: 0.0
                                    if (earTagInput.isNotEmpty() && litres > 0) {
                                        val tagDisplay = if (selectedCow != null) "#$earTagInput (${selectedCow!!.name})" else "#$earTagInput"
                                        val newEntry = RecentMilkingEntry(
                                            id = "m_${System.currentTimeMillis()}",
                                            cowTag = tagDisplay,
                                            litres = litres,
                                            time = "Just now",
                                            isMorning = isMorningShift
                                        )
                                        recentLogs = listOf(newEntry) + recentLogs
                                        earTagInput = ""
                                        yieldInput = ""
                                        selectedCow = null
                                        isEnteringTag = true
                                    }
                                }
                            },
                            enabled = if (isEnteringTag) earTagInput.isNotEmpty() else yieldInput.isNotEmpty(),
                            modifier = Modifier.fillMaxWidth().height(46.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text(
                                text = if (isEnteringTag) "Next: Enter Litres ➔" else "Save Cow Yield ✓",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }

            // Session History Section Header with Quick Minimize Indicator
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Logged Entries (${recentLogs.size})",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Tap to edit (OTP required)",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Session Logs List with bottom nav bar clearance
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(recentLogs) { log ->
                    RecentLogItem(
                        log = log,
                        onClick = {
                            entryToEdit = log
                            editLitresInput = "%.1f".format(log.litres)
                            editOtpInput = ""
                            isOtpVerified = false
                            editError = false
                        }
                    )
                }

                item {
                    // Clearance for floating IslandBottomBar
                    Spacer(modifier = Modifier.height(110.dp))
                }
            }
        }

        // Edit Entry ModalBottomSheet matching Web OTP Workflow
        if (entryToEdit != null) {
            ModalBottomSheet(
                onDismissRequest = { entryToEdit = null },
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
                                text = "Edit Milking Record",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Cow: ${entryToEdit!!.cowTag} • ${entryToEdit!!.time}",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        PillBadge(
                            text = if (isOtpVerified) "OTP Verified" else "Requires OTP",
                            containerColor = if (isOtpVerified) EmeraldPrimary.copy(alpha = 0.15f) else GoldAmber.copy(alpha = 0.15f),
                            contentColor = if (isOtpVerified) EmeraldPrimary else GoldAmber
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                    if (!isOtpVerified) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Manager Authorization Required",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "As per anti-fraud dairy rules, existing milk entries require farm manager OTP confirmation before editing.",
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        OutlinedTextField(
                            value = editOtpInput,
                            onValueChange = {
                                editOtpInput = it
                                editError = false
                            },
                            label = { Text("Manager OTP Code (e.g. 1234)") },
                            placeholder = { Text("Enter 4-digit code") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        if (editError) {
                            Text(
                                text = "Please enter a valid authorization code (e.g. 1234)",
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 12.sp
                            )
                        }

                        Button(
                            onClick = {
                                if (editOtpInput.trim().isNotEmpty()) {
                                    isOtpVerified = true
                                    editError = false
                                } else {
                                    editError = true
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Icon(Icons.Rounded.LockOpen, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Authorize & Unlock Edit", fontWeight = FontWeight.Bold)
                        }
                    } else {
                        // OTP Verified: Allow editing yield and deletion
                        OutlinedTextField(
                            value = editLitresInput,
                            onValueChange = { editLitresInput = it },
                            label = { Text("Adjusted Yield (Litres)") },
                            placeholder = { Text("e.g. 16.5") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    // Delete record flow
                                    recentLogs = recentLogs.filter { it.id != entryToEdit!!.id }
                                    entryToEdit = null
                                },
                                modifier = Modifier.weight(1f).height(48.dp),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Icon(Icons.Rounded.DeleteOutline, contentDescription = null, modifier = Modifier.size(18.dp), tint = RoseRed)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Delete", color = RoseRed, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = {
                                    val newLitres = editLitresInput.toDoubleOrNull()
                                    if (newLitres != null && newLitres > 0) {
                                        recentLogs = recentLogs.map {
                                            if (it.id == entryToEdit!!.id) it.copy(litres = newLitres) else it
                                        }
                                        entryToEdit = null
                                    }
                                },
                                modifier = Modifier.weight(1.5f).height(48.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Update Yield", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NumpadRow(digits: List<String>, onDigitClick: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        digits.forEach { digit ->
            NumpadKey(text = digit, modifier = Modifier.weight(1f)) {
                onDigitClick(digit)
            }
        }
    }
}

@Composable
fun NumpadKey(text: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Surface(
        modifier = modifier
            .height(52.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = text,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun RecentLogItem(
    log: RecentMilkingEntry,
    onClick: () -> Unit = {}
) {
    IslandCard(
        modifier = Modifier.fillMaxWidth(),
        elevation = 1.dp,
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = CircleShape,
                    color = EmeraldPrimary.copy(alpha = 0.12f),
                    modifier = Modifier.size(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Rounded.WaterDrop,
                            contentDescription = null,
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = log.cowTag,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${if (log.isMorning) "Morning" else "Evening"} • ${log.time} • Tap to edit",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${"%.1f".format(log.litres)} L",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = EmeraldPrimary
                )
                Spacer(modifier = Modifier.width(6.dp))
                Icon(
                    imageVector = Icons.Rounded.Edit,
                    contentDescription = "Edit",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Milking Keypad Light")
@Composable
fun MilkingKeypadScreenPreview() {
    FMSTheme(darkTheme = false) {
        MilkingKeypadScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Milking Keypad Dark")
@Composable
fun MilkingKeypadScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        MilkingKeypadScreen()
    }
}
