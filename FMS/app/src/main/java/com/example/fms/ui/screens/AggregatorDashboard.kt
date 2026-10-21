package com.example.fms.ui.screens

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.MilkBatch
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

@Composable
fun AggregatorDashboard() {
    var batches by remember {
        mutableStateOf(
            listOf(
                MilkBatch(
                    id = "b1",
                    farmerName = "John Mwangi",
                    farmName = "Baraka Dairy Cooperative",
                    litres = 280.0,
                    status = "Accepted",
                    time = "07:15 AM"
                ),
                MilkBatch(
                    id = "b2",
                    farmerName = "Faith Chepkemoi",
                    farmName = "Chepkemoi Hill Farm",
                    litres = 145.5,
                    status = "Accepted",
                    time = "07:45 AM"
                ),
                MilkBatch(
                    id = "b3",
                    farmerName = "Kiprono Bett",
                    farmName = "Sunrise Highland Pastoral",
                    litres = 92.0,
                    status = "Pending Test",
                    time = "08:10 AM"
                ),
                MilkBatch(
                    id = "b4",
                    farmerName = "Samson Kiprop",
                    farmName = "Riverbend Smallholders",
                    litres = 55.0,
                    status = "Rejected",
                    time = "08:30 AM"
                )
            )
        )
    }

    var showIntakeDialog by remember { mutableStateOf(false) }
    var farmerInput by remember { mutableStateOf("") }
    var farmInput by remember { mutableStateOf("") }
    var litresInput by remember { mutableStateOf("") }

    val totalIntakeLitres = batches.filter { it.status == "Accepted" }.sumOf { it.litres }
    val pendingCount = batches.count { it.status == "Pending Test" }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // 1. Hero Island
        item {
            HeroHeader(
                title = "Aggregator Intake",
                subtitle = "Bulk Cooler Station #4 • Milk Bulk Purchasing & Dispatch",
                roleBadge = "Milk Buyer",
                onNotificationClick = {}
            )
        }

        // 2. Overlapping Aggregator Intake Stats Island
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
                                text = "TODAY'S ACCEPTED INTAKE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${"%.1f".format(totalIntakeLitres)} L",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = EmeraldPrimary
                            )
                        }
                        Button(
                            onClick = { showIntakeDialog = true },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp)
                        ) {
                            Icon(Icons.Rounded.Add, contentDescription = "Add Batch", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Receive Batch", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        AggregatorMetric(
                            label = "Batches",
                            value = "${batches.size}",
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        AggregatorMetric(
                            label = "Pending Test",
                            value = "$pendingCount",
                            color = GoldAmber
                        )
                        AggregatorMetric(
                            label = "Rejected",
                            value = "${batches.count { it.status == "Rejected" }}",
                            color = RoseRed
                        )
                        AggregatorMetric(
                            label = "Cooler Cap.",
                            value = "85%",
                            color = SkyBlue
                        )
                    }
                }
            }
        }

        // 3. Saturday Plan Freeze & Financials Island
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-14).dp)
                    .padding(horizontal = 16.dp)
            ) {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 3.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(GoldAmber.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.EventBusy,
                                contentDescription = "Saturday Policy",
                                tint = GoldAmber,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Saturday Settlement Policy",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Payouts & billing freeze from Fri 6PM to Sat 6PM. Plans automatically extend.",
                                fontSize = 11.sp,
                                lineHeight = 15.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
            }
        }

        // 4. Section Title
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Farmer Delivery Ledger",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Lactometer & Alcohol Tested",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
        }

        // 5. Batch Ledger Items
        items(batches) { batch ->
            MilkBatchItem(
                batch = batch,
                onApprove = {
                    batches = batches.map {
                        if (it.id == batch.id) it.copy(status = "Accepted") else it
                    }
                },
                onReject = {
                    batches = batches.map {
                        if (it.id == batch.id) it.copy(status = "Rejected") else it
                    }
                }
            )
            Spacer(modifier = Modifier.height(10.dp))
        }

        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }

    if (showIntakeDialog) {
        AlertDialog(
            onDismissRequest = { showIntakeDialog = false },
            title = {
                Text(
                    text = "Receive Farmer Milk Batch",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = farmerInput,
                        onValueChange = { farmerInput = it },
                        label = { Text("Farmer Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = farmInput,
                        onValueChange = { farmInput = it },
                        label = { Text("Farm / Cooperative Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = litresInput,
                        onValueChange = { litresInput = it },
                        label = { Text("Litres Delivered") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val litres = litresInput.toDoubleOrNull() ?: 0.0
                        if (farmerInput.isNotBlank() && litres > 0) {
                            val newBatch = MilkBatch(
                                id = "b_${System.currentTimeMillis()}",
                                farmerName = farmerInput,
                                farmName = farmInput.ifBlank { "Independent Supplier" },
                                litres = litres,
                                status = "Accepted",
                                time = "Just now"
                            )
                            batches = listOf(newBatch) + batches
                        }
                        farmerInput = ""
                        farmInput = ""
                        litresInput = ""
                        showIntakeDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Record Batch")
                }
            },
            dismissButton = {
                TextButton(onClick = { showIntakeDialog = false }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
fun AggregatorMetric(
    label: String,
    value: String,
    color: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}

@Composable
fun MilkBatchItem(
    batch: MilkBatch,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    val (statusBg, statusColor, statusText) = when (batch.status) {
        "Accepted" -> Triple(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary, "Accepted")
        "Rejected" -> Triple(RoseRed.copy(alpha = 0.15f), RoseRed, "Rejected")
        else -> Triple(GoldAmber.copy(alpha = 0.15f), GoldAmber, "Testing")
    }

    IslandCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        elevation = 3.dp
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = batch.farmerName,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "${batch.farmName} • ${batch.time}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }

            PillBadge(
                text = statusText,
                containerColor = statusBg,
                contentColor = statusColor
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Rounded.Opacity,
                    contentDescription = "Volume",
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "${"%.1f".format(batch.litres)} Litres",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            if (batch.status == "Pending Test") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalButton(
                        onClick = onReject,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.filledTonalButtonColors(containerColor = RoseRed.copy(alpha = 0.15f)),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("Reject", color = RoseRed, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = onApprove,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("Accept", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
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
