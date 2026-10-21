package com.example.fms.ui.screens.aggregator

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.MilkBatch
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

@Composable
fun AggregatorDashboard() {
    var batches by remember {
        mutableStateOf(
            listOf(
                MilkBatch("b1", "John Mwangi", "Baraka Dairy Cooperative", 280.0, "Accepted", "07:15 AM"),
                MilkBatch("b2", "Faith Chepkemoi", "Chepkemoi Hill Farm", 145.5, "Accepted", "07:45 AM"),
                MilkBatch("b3", "Kiprono Bett", "Sunrise Highland Pastoral", 92.0, "Pending Test", "08:10 AM"),
                MilkBatch("b4", "Samson Kiprop", "Riverbend Smallholders", 55.0, "Rejected", "08:35 AM")
            )
        )
    }

    val totalAcceptedLitres = batches.filter { it.status == "Accepted" }.sumOf { it.litres }
    val tankMaxCapacity = 5000.0 // 5,000 Litres chilling tank
    val tankFillRatio = (totalAcceptedLitres / tankMaxCapacity).toFloat().coerceIn(0f, 1f)

    var showIntakeDialog by remember { mutableStateOf(false) }
    var selectedBatchForReceipt by remember { mutableStateOf<MilkBatch?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Hero Header
        item {
            HeroHeader(
                title = "Bulk Milk Intake Station",
                subtitle = "Eldoret Chilling Hub • Station #03"
            )
        }

        // Chilling Tank Status Card
        item {
            IslandCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Cooler Storage Level", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        PillBadge(
                            text = "Temp: 3.6°C",
                            containerColor = SkyBlue.copy(alpha = 0.15f),
                            contentColor = SkyBlue
                        )
                    }

                    Text(
                        text = "${totalAcceptedLitres.toInt()} / ${tankMaxCapacity.toInt()} Litres Chilled",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    LinearProgressIndicator(
                        progress = { tankFillRatio },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(RoundedCornerShape(5.dp)),
                        color = SkyBlue,
                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Target Dispatch: 12:00 PM", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("${(tankFillRatio * 100).toInt()}% Capacity", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = SkyBlue)
                    }
                }
            }
        }

        // Intake Lab Test Action CTA
        item {
            Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                Button(
                    onClick = { showIntakeDialog = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Rounded.Science, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("New Farmer Delivery & Milk Lab Test", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }

        // Daily Batches Section
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Today's Delivery Batches",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )

                batches.forEach { batch ->
                    val statusColor = when (batch.status) {
                        "Accepted" -> Triple(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary, Icons.Rounded.CheckCircle)
                        "Pending Test" -> Triple(GoldAmber.copy(alpha = 0.15f), GoldAmber, Icons.Rounded.HourglassTop)
                        else -> Triple(RoseRed.copy(alpha = 0.15f), RoseRed, Icons.Rounded.Cancel)
                    }

                    IslandCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedBatchForReceipt = batch }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = batch.farmerName,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = "${batch.farmName} · ${batch.time}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${batch.litres} Litres",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = EmeraldPrimary
                                )
                            }

                            PillBadge(
                                text = batch.status,
                                containerColor = statusColor.first,
                                contentColor = statusColor.second
                            )
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(40.dp))
        }
    }

    // New Delivery & Quality Lab Test Dialog
    if (showIntakeDialog) {
        var farmerNameInput by remember { mutableStateOf("") }
        var litresInput by remember { mutableStateOf("") }
        var lactometerDensity by remember { mutableStateOf("29.0") } // Valid: 28-32
        var alcoholTestPassed by remember { mutableStateOf(true) }
        var temperatureInput by remember { mutableStateOf("3.8") }

        AlertDialog(
            onDismissRequest = { showIntakeDialog = false },
            title = { Text("Milk Intake Quality Lab", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = farmerNameInput,
                        onValueChange = { farmerNameInput = it },
                        placeholder = { Text("Farmer Name / Member ID") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    OutlinedTextField(
                        value = litresInput,
                        onValueChange = { litresInput = it },
                        placeholder = { Text("Volume (Litres)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                    Text("Quality Parameters:", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Lactometer Density:", fontSize = 12.sp)
                        OutlinedTextField(
                            value = lactometerDensity,
                            onValueChange = { lactometerDensity = it },
                            modifier = Modifier.width(90.dp),
                            singleLine = true,
                            shape = RoundedCornerShape(8.dp)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Alcohol Clot Test (68%):", fontSize = 12.sp)
                        FilterChip(
                            selected = alcoholTestPassed,
                            onClick = { alcoholTestPassed = !alcoholTestPassed },
                            label = { Text(if (alcoholTestPassed) "Pass (Grade A)" else "Clotted (Fail)") },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = if (alcoholTestPassed) EmeraldPrimary.copy(alpha = 0.15f) else RoseRed.copy(alpha = 0.15f),
                                selectedLabelColor = if (alcoholTestPassed) EmeraldPrimary else RoseRed
                            )
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val parsedLitres = litresInput.toDoubleOrNull() ?: 50.0
                        val isRejected = !alcoholTestPassed || (lactometerDensity.toDoubleOrNull() ?: 29.0) < 27.0
                        val newBatch = MilkBatch(
                            id = "b_${System.currentTimeMillis()}",
                            farmerName = if (farmerNameInput.isNotBlank()) farmerNameInput else "Unknown Member",
                            farmName = "Intake Bay #1",
                            litres = parsedLitres,
                            status = if (isRejected) "Rejected" else "Accepted",
                            time = "Just now"
                        )
                        batches = listOf(newBatch) + batches
                        showIntakeDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("Submit Lab Test")
                }
            },
            dismissButton = {
                TextButton(onClick = { showIntakeDialog = false }) { Text("Cancel") }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }

    // Delivery Slip Dialog
    selectedBatchForReceipt?.let { batch ->
        val ratePerLitre = 52.0
        val grossPayout = batch.litres * ratePerLitre

        AlertDialog(
            onDismissRequest = { selectedBatchForReceipt = null },
            title = { Text("Delivery Receipt Slip", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Farmer: ${batch.farmerName}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Coop Member Ref: ${batch.id.uppercase()}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Volume Received:")
                        Text("${batch.litres} L", fontWeight = FontWeight.Bold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Contract Base Rate:")
                        Text("KES $ratePerLitre / L", fontWeight = FontWeight.SemiBold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Quality Classification:")
                        Text(batch.status, fontWeight = FontWeight.Bold, color = if (batch.status == "Accepted") EmeraldPrimary else RoseRed)
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Estimated Gross Payout:", fontWeight = FontWeight.Bold)
                        Text("KES ${grossPayout.toInt()}", fontWeight = FontWeight.Bold, color = EmeraldPrimary, fontSize = 16.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedBatchForReceipt = null },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("Print / SMS Slip")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Aggregator Dashboard Light")
@Composable
fun AggregatorDashboardPreview() {
    FMSTheme(darkTheme = false) {
        AggregatorDashboard()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Aggregator Dashboard Dark")
@Composable
fun AggregatorDashboardDarkPreview() {
    FMSTheme(darkTheme = true) {
        AggregatorDashboard()
    }
}
