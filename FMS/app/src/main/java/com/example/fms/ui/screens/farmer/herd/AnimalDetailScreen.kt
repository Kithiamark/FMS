package com.example.fms.ui.screens.farmer.herd

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.CattleRecord
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnimalDetailScreen(
    cow: CattleRecord = CattleRecord("1", "#104", "Bessie", "Friesian", "Healthy", 25.5),
    onBackClick: () -> Unit = {},
    onLogMedicalEvent: () -> Unit = {}
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Animal Passport",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {}) {
                        Icon(Icons.Rounded.QrCode, contentDescription = "View QR", tint = EmeraldPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Cow Hero Header Island
            item {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 6.dp
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = EmeraldPrimary.copy(alpha = 0.15f),
                            modifier = Modifier.size(76.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Rounded.Pets,
                                    contentDescription = null,
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(42.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = cow.name,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            PillBadge(
                                text = "Tag ${cow.tagNumber}",
                                containerColor = ForestGreen,
                                contentColor = Color.White
                            )
                            PillBadge(
                                text = cow.breed,
                                containerColor = SkyBlue.copy(alpha = 0.15f),
                                contentColor = SkyBlue
                            )
                            PillBadge(
                                text = cow.healthStatus,
                                containerColor = if (cow.healthStatus == "Healthy") EmeraldPrimary.copy(alpha = 0.15f) else RoseRed.copy(alpha = 0.15f),
                                contentColor = if (cow.healthStatus == "Healthy") EmeraldPrimary else RoseRed
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Metric pills row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                .padding(vertical = 12.dp, horizontal = 16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            PassportMetric("Daily Avg", "${cow.dailyAvgYield} L", EmeraldPrimary)
                            PassportMetric("Weight", "520 kg", SkyBlue)
                            PassportMetric("Lactation", "2nd Cycle", GoldAmber)
                            PassportMetric("Age", "3.5 Yrs", MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }

            // Health & Medical Records
            item {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 3.dp
                ) {
                    Column(modifier = Modifier.padding(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Medical & Vaccination Timeline",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            IconButton(onClick = onLogMedicalEvent) {
                                Icon(Icons.Rounded.AddCircleOutline, contentDescription = "Add Medical", tint = EmeraldPrimary)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        MedicalTimelineItem(
                            title = "Foot & Mouth Booster Vaccine",
                            date = "Oct 12, 2026",
                            doctor = "Dr. Kiprono (DVM)",
                            status = "Verified",
                            statusColor = EmeraldPrimary
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        MedicalTimelineItem(
                            title = "Quarter Teat Cleaning & Dip",
                            date = "Sep 28, 2026",
                            doctor = "Barn Ops Routine",
                            status = "Completed",
                            statusColor = SkyBlue
                        )
                    }
                }
            }

            // Quick Actions Button
            item {
                IslandButton(
                    text = "Request Vet Visit for ${cow.name}",
                    icon = Icons.Rounded.MedicalServices,
                    onClick = onLogMedicalEvent
                )
            }

            item {
                Spacer(modifier = Modifier.height(30.dp))
            }
        }
    }
}

@Composable
fun PassportMetric(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = color)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun MedicalTimelineItem(
    title: String,
    date: String,
    doctor: String,
    status: String,
    statusColor: Color
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = "$date • By $doctor", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            PillBadge(
                text = status,
                containerColor = statusColor.copy(alpha = 0.15f),
                contentColor = statusColor
            )
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Animal Detail Light")
@Composable
fun AnimalDetailScreenPreview() {
    FMSTheme(darkTheme = false) {
        AnimalDetailScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Animal Detail Dark")
@Composable
fun AnimalDetailScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        AnimalDetailScreen()
    }
}
