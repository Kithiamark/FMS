package com.example.fms.ui.screens.farmer.milk

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Check
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
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.EmeraldPrimary
import com.example.fms.ui.theme.RoseRed

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

    var cows by remember {
        mutableStateOf(
            listOf(
                CowMilkEntry("1", "#104", "Bessie", "14.5", "11.0"),
                CowMilkEntry("2", "#108", "Daisy", "18.0", "15.5"),
                CowMilkEntry("3", "#112", "Bella", "12.0", "9.5"),
                CowMilkEntry("4", "#119", "Rosie", "", "")
            )
        )
    }

    var calvesLitres by remember { mutableStateOf("11.5") }
    var homeUseLitres by remember { mutableStateOf("5.0") }
    var soldLitres by remember { mutableStateOf("60.0") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showSuccessDialog by remember { mutableStateOf(false) }

    val totalProduced = cows.sumOf { it.totalCowYield }
    val totalAllocated = (calvesLitres.toDoubleOrNull() ?: 0.0) +
            (homeUseLitres.toDoubleOrNull() ?: 0.0) +
            (soldLitres.toDoubleOrNull() ?: 0.0)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Daily Milk Entry", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Text(selectedDate, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    PillBadge(
                        text = "${"%.1f".format(totalProduced)} L",
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
                shadowElevation = 10.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp)) {
                    errorMessage?.let { err ->
                        Text(
                            text = err,
                            color = RoseRed,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (currentStep == EntryStep.ALLOCATIONS) {
                            OutlinedButton(
                                onClick = { currentStep = EntryStep.PRODUCTION },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Text("Back to Yields", fontWeight = FontWeight.Bold)
                            }
                        }

                        IslandButton(
                            text = if (currentStep == EntryStep.PRODUCTION) "Go to Allocations" else "Save Daily Records",
                            icon = if (currentStep == EntryStep.PRODUCTION) Icons.Rounded.ArrowForward else Icons.Rounded.Check,
                            modifier = Modifier.weight(if (currentStep == EntryStep.ALLOCATIONS) 1.5f else 1f),
                            onClick = {
                                if (currentStep == EntryStep.PRODUCTION) {
                                    if (totalProduced <= 0) {
                                        errorMessage = "Please enter yield for at least one cow."
                                    } else {
                                        errorMessage = null
                                        currentStep = EntryStep.ALLOCATIONS
                                    }
                                } else {
                                    if (totalAllocated > totalProduced) {
                                        errorMessage = "Allocations (${totalAllocated}L) exceed total produced (${totalProduced}L)!"
                                    } else {
                                        errorMessage = null
                                        showSuccessDialog = true
                                    }
                                }
                            }
                        )
                    }
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
                    .padding(horizontal = 16.dp, vertical = 8.dp)
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
                        modifier = Modifier.padding(vertical = 8.dp),
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
                        modifier = Modifier.padding(vertical = 8.dp),
                        textAlign = TextAlign.Center,
                        fontSize = 13.sp,
                        fontWeight = if (currentStep == EntryStep.ALLOCATIONS) FontWeight.Bold else FontWeight.Medium,
                        color = if (currentStep == EntryStep.ALLOCATIONS) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            AnimatedContent(
                targetState = currentStep,
                transitionSpec = {
                    if (targetState == EntryStep.ALLOCATIONS) {
                        slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                    } else {
                        slideInHorizontally { -it } togetherWith slideOutHorizontally { it }
                    }
                },
                label = "MilkEntryStep"
            ) { step ->
                when (step) {
                    EntryStep.PRODUCTION -> {
                        YieldStepPage(
                            cows = cows,
                            onCowYieldChange = { animalId, am, pm ->
                                cows = cows.map {
                                    if (it.animalId == animalId) it.copy(morningYield = am, eveningYield = pm) else it
                                }
                            }
                        )
                    }
                    EntryStep.ALLOCATIONS -> {
                        AllocationStepPage(
                            totalProduced = totalProduced,
                            calvesLitres = calvesLitres,
                            onCalvesChange = { calvesLitres = it },
                            homeUseLitres = homeUseLitres,
                            onHomeUseChange = { homeUseLitres = it },
                            soldLitres = soldLitres,
                            onSoldChange = { soldLitres = it }
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
            title = { Text("Records Saved", fontWeight = FontWeight.Bold) },
            text = {
                Text("Total ${"%.1f".format(totalProduced)} Litres successfully committed to farm records and synchronized with offline storage.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSuccessDialog = false
                        onSubmitSuccess()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("Done")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}
