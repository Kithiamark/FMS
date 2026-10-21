package com.example.fms.ui.screens.farmer

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class CowMilkInput(
    val animalId: String,
    val tagNumber: String,
    val name: String,
    var morningYield: String = "",
    var eveningYield: String = ""
)

enum class EntryStep {
    PRODUCTION,
    ALLOCATIONS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyMilkEntryScreen(
    onBackClick: () -> Unit = {},
    onSubmitSuccess: () -> Unit = {}
) {
    var currentStep by remember { mutableStateOf(EntryStep.PRODUCTION) }
    var selectedDate by remember { mutableStateOf("Today, Oct 21") }

    // Mock cows list loaded from farm herd
    var cows by remember {
        mutableStateOf(
            listOf(
                CowMilkInput("1", "#104", "Bessie", "14.5", "11.0"),
                CowMilkInput("2", "#108", "Daisy", "18.0", "15.5"),
                CowMilkInput("3", "#112", "Bella", "12.0", "9.5"),
                CowMilkInput("4", "#119", "Rosie", "", "")
            )
        )
    }

    // Collective Allocation values
    var calvesLitres by remember { mutableStateOf("11.5") }
    var homeUseLitres by remember { mutableStateOf("5.0") }
    var soldLitres by remember { mutableStateOf("60.0") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showSuccessDialog by remember { mutableStateOf(false) }

    // Computations
    val totalMorning = cows.sumOf { it.morningYield.toDoubleOrNull() ?: 0.0 }
    val totalEvening = cows.sumOf { it.eveningYield.toDoubleOrNull() ?: 0.0 }
    val totalProduced = totalMorning + totalEvening

    val calvesVal = calvesLitres.toDoubleOrNull() ?: 0.0
    val homeVal = homeUseLitres.toDoubleOrNull() ?: 0.0
    val soldVal = soldLitres.toDoubleOrNull() ?: 0.0
    val totalAllocated = calvesVal + homeVal + soldVal
    val unallocatedBalance = totalProduced - totalAllocated

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Daily Milk Entry",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = selectedDate,
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
                        text = "${"%.1f".format(totalProduced)} L Total",
                        containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                        contentColor = EmeraldPrimary
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        bottomBar = {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding(),
                shadowElevation = 12.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (currentStep == EntryStep.ALLOCATIONS) {
                        OutlinedButton(
                            onClick = { currentStep = EntryStep.PRODUCTION },
                            modifier = Modifier
                                .weight(1f)
                                .height(54.dp),
                            shape = RoundedCornerShape(18.dp)
                        ) {
                            Text("Back to Yields", fontWeight = FontWeight.Bold)
                        }
                    }

                    IslandButton(
                        text = if (currentStep == EntryStep.PRODUCTION) "Proceed to Allocations" else "Save Daily Records",
                        icon = if (currentStep == EntryStep.PRODUCTION) Icons.Rounded.ArrowForward else Icons.Rounded.Check,
                        modifier = Modifier.weight(if (currentStep == EntryStep.ALLOCATIONS) 1.5f else 1f),
                        isLoading = isSubmitting,
                        onClick = {
                            if (currentStep == EntryStep.PRODUCTION) {
                                if (totalProduced <= 0) {
                                    errorMessage = "Please enter yield for at least one cow."
                                } else {
                                    errorMessage = null
                                    currentStep = EntryStep.ALLOCATIONS
                                }
                            } else {
                                // Validate allocations
                                if (totalAllocated > totalProduced) {
                                    errorMessage = "Allocations (${totalAllocated}L) exceed total produced (${totalProduced}L)!"
                                } else {
                                    errorMessage = null
                                    isSubmitting = true
                                    showSuccessDialog = true
                                    isSubmitting = false
                                }
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Step Switcher Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    .padding(4.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (currentStep == EntryStep.PRODUCTION) MaterialTheme.colorScheme.surface else Color.Transparent,
                    shadowElevation = if (currentStep == EntryStep.PRODUCTION) 2.dp else 0.dp,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { currentStep = EntryStep.PRODUCTION }
                ) {
                    Text(
                        text = "1. Cow Yields",
                        modifier = Modifier.padding(vertical = 10.dp),
                        textAlign = TextAlign.Center,
                        fontSize = 13.sp,
                        fontWeight = if (currentStep == EntryStep.PRODUCTION) FontWeight.Bold else FontWeight.Medium,
                        color = if (currentStep == EntryStep.PRODUCTION) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (currentStep == EntryStep.ALLOCATIONS) MaterialTheme.colorScheme.surface else Color.Transparent,
                    shadowElevation = if (currentStep == EntryStep.ALLOCATIONS) 2.dp else 0.dp,
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            if (totalProduced > 0) currentStep = EntryStep.ALLOCATIONS
                        }
                ) {
                    Text(
                        text = "2. Allocations",
                        modifier = Modifier.padding(vertical = 10.dp),
                        textAlign = TextAlign.Center,
                        fontSize = 13.sp,
                        fontWeight = if (currentStep == EntryStep.ALLOCATIONS) FontWeight.Bold else FontWeight.Medium,
                        color = if (currentStep == EntryStep.ALLOCATIONS) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            AnimatedVisibility(visible = errorMessage != null) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp),
                    color = RoseRed.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = errorMessage ?: "",
                        color = RoseRed,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            // Screen Content animated between Step 1 and Step 2
            AnimatedContent(
                targetState = currentStep,
                label = "step_animation"
            ) { step ->
                when (step) {
                    EntryStep.PRODUCTION -> {
                        ProductionYieldsStep(
                            cows = cows,
                            totalMorning = totalMorning,
                            totalEvening = totalEvening,
                            totalProduced = totalProduced,
                            onCowYieldChanged = { index, morning, evening ->
                                cows = cows.toMutableList().also {
                                    it[index] = it[index].copy(
                                        morningYield = morning,
                                        eveningYield = evening
                                    )
                                }
                            }
                        )
                    }
                    EntryStep.ALLOCATIONS -> {
                        AllocationsStep(
                            totalProduced = totalProduced,
                            calvesLitres = calvesLitres,
                            homeUseLitres = homeUseLitres,
                            soldLitres = soldLitres,
                            unallocatedBalance = unallocatedBalance,
                            onCalvesChanged = { calvesLitres = it },
                            onHomeChanged = { homeUseLitres = it },
                            onSoldChanged = { soldLitres = it }
                        )
                    }
                }
            }
        }
    }

    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = {
                showSuccessDialog = false
                onSubmitSuccess()
            },
            icon = {
                Icon(
                    imageVector = Icons.Rounded.CheckCircle,
                    contentDescription = null,
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(48.dp)
                )
            },
            title = {
                Text(
                    text = "Milk Records Saved!",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    textAlign = TextAlign.Center
                )
            },
            text = {
                Text(
                    text = "Successfully logged ${"%.1f".format(totalProduced)}L total milk for $selectedDate across ${cows.count { (it.morningYield.toDoubleOrNull() ?: 0.0) + (it.eveningYield.toDoubleOrNull() ?: 0.0) > 0 }} cows.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSuccessDialog = false
                        onSubmitSuccess()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Done")
                }
            },
            shape = RoundedCornerShape(24.dp)
        )
    }
}

@Composable
fun ProductionYieldsStep(
    cows: List<CowMilkInput>,
    totalMorning: Double,
    totalEvening: Double,
    totalProduced: Double,
    onCowYieldChanged: (index: Int, morning: String, evening: String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Quick Summary Island Card
        item {
            IslandCard(
                modifier = Modifier.fillMaxWidth(),
                elevation = 4.dp
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "MORNING",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${"%.1f".format(totalMorning)} L",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = SkyBlue
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "EVENING",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${"%.1f".format(totalEvening)} L",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = GoldAmber
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "TOTAL DAY",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${"%.1f".format(totalProduced)} L",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = EmeraldPrimary
                        )
                    }
                }
            }
        }

        // Section header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Active Herd (${cows.size} Cows)",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Morning & Evening",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Cow Input Cards
        items(cows.size) { index ->
            val cow = cows[index]
            val cowTotal = (cow.morningYield.toDoubleOrNull() ?: 0.0) + (cow.eveningYield.toDoubleOrNull() ?: 0.0)

            IslandCard(
                modifier = Modifier.fillMaxWidth(),
                elevation = 2.dp
            ) {
                Column(modifier = Modifier.padding(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = EmeraldPrimary.copy(alpha = 0.12f),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = cow.tagNumber,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = EmeraldPrimary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = cow.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        if (cowTotal > 0) {
                            PillBadge(
                                text = "${"%.1f".format(cowTotal)} L",
                                containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                contentColor = EmeraldPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = cow.morningYield,
                            onValueChange = { onCowYieldChanged(index, it, cow.eveningYield) },
                            label = { Text("Morning (L)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            leadingIcon = {
                                Icon(Icons.Rounded.WbSunny, contentDescription = null, tint = SkyBlue, modifier = Modifier.size(18.dp))
                            }
                        )

                        OutlinedTextField(
                            value = cow.eveningYield,
                            onValueChange = { onCowYieldChanged(index, cow.morningYield, it) },
                            label = { Text("Evening (L)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            leadingIcon = {
                                Icon(Icons.Rounded.NightsStay, contentDescription = null, tint = GoldAmber, modifier = Modifier.size(18.dp))
                            }
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

@Composable
fun AllocationsStep(
    totalProduced: Double,
    calvesLitres: String,
    homeUseLitres: String,
    soldLitres: String,
    unallocatedBalance: Double,
    onCalvesChanged: (String) -> Unit,
    onHomeChanged: (String) -> Unit,
    onSoldChanged: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Balance Overview Card
        item {
            IslandCard(
                modifier = Modifier.fillMaxWidth(),
                elevation = 4.dp
            ) {
                Column(modifier = Modifier.padding(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "TOTAL TO ALLOCATE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${"%.1f".format(totalProduced)} Litres",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = EmeraldPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (unallocatedBalance >= 0) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                else RoseRed.copy(alpha = 0.12f)
                            )
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (unallocatedBalance >= 0) "Unallocated Buffer:" else "Deficit Exceeded:",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (unallocatedBalance >= 0) MaterialTheme.colorScheme.onSurface else RoseRed
                        )
                        Text(
                            text = "${"%.1f".format(unallocatedBalance)} L",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (unallocatedBalance >= 0) EmeraldPrimary else RoseRed
                        )
                    }
                }
            }
        }

        // Single Entry Allocation Fields
        item {
            IslandCard(
                modifier = Modifier.fillMaxWidth(),
                elevation = 3.dp
            ) {
                Column(
                    modifier = Modifier.padding(4.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "Distribution Allocations",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    // Commercial Sales
                    OutlinedTextField(
                        value = soldLitres,
                        onValueChange = onSoldChanged,
                        label = { Text("Commercial Sales / Dairy Cooperative (L)") },
                        leadingIcon = {
                            Icon(Icons.Rounded.LocalShipping, contentDescription = null, tint = EmeraldPrimary)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    // Calves Feeding
                    OutlinedTextField(
                        value = calvesLitres,
                        onValueChange = onCalvesChanged,
                        label = { Text("Calves Feeding (L)") },
                        leadingIcon = {
                            Icon(Icons.Rounded.Pets, contentDescription = null, tint = SkyBlue)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    // Home Consumption
                    OutlinedTextField(
                        value = homeUseLitres,
                        onValueChange = onHomeChanged,
                        label = { Text("Home & Worker Consumption (L)") },
                        leadingIcon = {
                            Icon(Icons.Rounded.Home, contentDescription = null, tint = GoldAmber)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Daily Milk Entry Light")
@Composable
fun DailyMilkEntryScreenPreview() {
    FMSTheme(darkTheme = false) {
        DailyMilkEntryScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Daily Milk Entry Dark")
@Composable
fun DailyMilkEntryScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        DailyMilkEntryScreen()
    }
}
