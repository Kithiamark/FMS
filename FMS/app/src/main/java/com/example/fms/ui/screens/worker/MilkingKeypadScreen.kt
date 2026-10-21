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
    var showSuccessFeedback by remember { mutableStateOf(false) }

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

            // Dual Active Display Island (Ear Tag & Yield)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Ear Tag Display Cell
                Surface(
                    modifier = Modifier
                        .weight(1.2f)
                        .height(84.dp)
                        .clickable { isEnteringTag = true },
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = androidx.compose.foundation.BorderStroke(
                        width = if (isEnteringTag) 2.dp else 1.dp,
                        color = if (isEnteringTag) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                    ),
                    shadowElevation = if (isEnteringTag) 4.dp else 1.dp
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "COW TAG #",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isEnteringTag) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = if (earTagInput.isEmpty()) "#---" else "#$earTagInput",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                // Litres Display Cell
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .height(84.dp)
                        .clickable { isEnteringTag = false },
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = androidx.compose.foundation.BorderStroke(
                        width = if (!isEnteringTag) 2.dp else 1.dp,
                        color = if (!isEnteringTag) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                    ),
                    shadowElevation = if (!isEnteringTag) 4.dp else 1.dp
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "LITRES",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (!isEnteringTag) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = if (yieldInput.isEmpty()) "0.0 L" else "$yieldInput L",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // High-Speed Tactile Numpad
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp),
                shape = RoundedCornerShape(24.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 4.dp
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
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
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
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
                                .height(52.dp)
                                .clickable {
                                    if (isEnteringTag) {
                                        if (earTagInput.isNotEmpty()) earTagInput = earTagInput.dropLast(1)
                                    } else {
                                        if (yieldInput.isNotEmpty()) yieldInput = yieldInput.dropLast(1)
                                    }
                                },
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Rounded.Backspace, contentDescription = "Delete", tint = MaterialTheme.colorScheme.onSurface)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Commit Button
                    IslandButton(
                        text = if (isEnteringTag) "Next: Enter Litres ➔" else "Save Cow Yield ✓",
                        enabled = if (isEnteringTag) earTagInput.isNotEmpty() else yieldInput.isNotEmpty(),
                        onClick = {
                            if (isEnteringTag) {
                                isEnteringTag = false
                            } else {
                                val litres = yieldInput.toDoubleOrNull() ?: 0.0
                                if (earTagInput.isNotEmpty() && litres > 0) {
                                    val newEntry = RecentMilkingEntry(
                                        id = "m_${System.currentTimeMillis()}",
                                        cowTag = "#$earTagInput",
                                        litres = litres,
                                        time = "Just now",
                                        isMorning = isMorningShift
                                    )
                                    recentLogs = listOf(newEntry) + recentLogs
                                    earTagInput = ""
                                    yieldInput = ""
                                    isEnteringTag = true
                                    showSuccessFeedback = true
                                }
                            }
                        }
                    )
                }
            }

            // Session History Section Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Logged This Session (${recentLogs.size})",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Tap to edit (OTP req.)",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Session Logs List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(recentLogs) { log ->
                    RecentLogItem(log = log)
                }

                item {
                    Spacer(modifier = Modifier.height(20.dp))
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
fun RecentLogItem(log: RecentMilkingEntry) {
    IslandCard(
        modifier = Modifier.fillMaxWidth(),
        elevation = 1.dp
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
                        text = "${if (log.isMorning) "Morning" else "Evening"} • ${log.time}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Text(
                text = "${"%.1f".format(log.litres)} L",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 16.sp,
                color = EmeraldPrimary
            )
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
