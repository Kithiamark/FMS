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
import com.example.fms.data.model.VetInquiry
import com.example.fms.ui.components.HeroHeader
import com.example.fms.ui.components.IslandCard
import com.example.fms.ui.components.PillBadge
import com.example.fms.ui.theme.*

@Composable
fun VetDashboard() {
    var inquiries by remember {
        mutableStateOf(
            listOf(
                VetInquiry(
                    id = "v1",
                    farmerName = "Baraka Dairy Farm",
                    cowTag = "COW-#104 (Bessie)",
                    symptoms = "Reduced milk yield (-40%), slight swelling in rear right quarter, mild fever.",
                    urgency = "HIGH",
                    date = "10 mins ago"
                ),
                VetInquiry(
                    id = "v2",
                    farmerName = "Kiprono Meadow Ranch",
                    cowTag = "HEIFER-#88",
                    symptoms = "Limping on right front leg after pasture grazing, hoof inspect recommended.",
                    urgency = "MEDIUM",
                    date = "45 mins ago"
                ),
                VetInquiry(
                    id = "v3",
                    farmerName = "Green Valley Homestead",
                    cowTag = "CALF-#312",
                    symptoms = "Routine checkup: 3-month booster vaccination (Anthrax & Blackquarter) due.",
                    urgency = "LOW",
                    date = "2 hours ago"
                )
            )
        )
    }

    var showReplyDialog by remember { mutableStateOf(false) }
    var selectedInquiry by remember { mutableStateOf<VetInquiry?>(null) }
    var prescriptionNote by remember { mutableStateOf("") }

    val urgentCount = inquiries.count { it.urgency == "HIGH" }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // 1. Hero Island
        item {
            HeroHeader(
                title = "Veterinary Services",
                subtitle = "Active Clinical Calls • Herd Triage & Tele-Vet",
                roleBadge = "Veterinarian",
                onNotificationClick = {}
            )
        }

        // 2. Overlapping Metrics Island
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
                                text = "PATIENT TRIAGE QUEUE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${inquiries.size} Active Cases",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        if (urgentCount > 0) {
                            PillBadge(
                                text = "$urgentCount Urgent Attention",
                                containerColor = RoseRed.copy(alpha = 0.15f),
                                contentColor = RoseRed
                            )
                        } else {
                            PillBadge(
                                text = "All Stable",
                                containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                contentColor = EmeraldPrimary
                            )
                        }
                    }
                }
            }
        }

        // 3. Clinical Quick Actions Island
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-14).dp)
                    .padding(horizontal = 16.dp)
            ) {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 4.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        VetActionButton(
                            icon = Icons.Rounded.MedicalServices,
                            title = "Prescribe",
                            color = EmeraldPrimary
                        )
                        VetActionButton(
                            icon = Icons.Rounded.EventAvailable,
                            title = "Farm Visit",
                            color = SkyBlue
                        )
                        VetActionButton(
                            icon = Icons.Rounded.Vaccines,
                            title = "Vaccines",
                            color = GoldAmber
                        )
                        VetActionButton(
                            icon = Icons.Rounded.Call,
                            title = "Emergency",
                            color = RoseRed
                        )
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
                    text = "Farmer Consultations & Tele-Vet",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Live Sync",
                    fontSize = 12.sp,
                    color = EmeraldPrimary,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        // 5. Patient Inquiry Cards
        items(inquiries) { inquiry ->
            VetInquiryCard(
                inquiry = inquiry,
                onRespond = {
                    selectedInquiry = inquiry
                    showReplyDialog = true
                }
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

        // Bottom space
        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }

    // Prescription / Advice Modal Dialog
    if (showReplyDialog && selectedInquiry != null) {
        AlertDialog(
            onDismissRequest = { showReplyDialog = false },
            title = {
                Text(
                    text = "Clinical Response: ${selectedInquiry?.cowTag}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Farmer: ${selectedInquiry?.farmerName}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Reported Symptoms: ${selectedInquiry?.symptoms}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    OutlinedTextField(
                        value = prescriptionNote,
                        onValueChange = { prescriptionNote = it },
                        label = { Text("Clinical Rx / Immediate Treatment") },
                        placeholder = { Text("e.g. Administer Penicillin intramammary infusion 10ml BID") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        inquiries = inquiries.filter { it.id != selectedInquiry?.id }
                        prescriptionNote = ""
                        showReplyDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Send Rx Advice")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReplyDialog = false }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
fun VetActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(color.copy(alpha = 0.14f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = color,
                modifier = Modifier.size(26.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = title,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
        )
    }
}

@Composable
fun VetInquiryCard(
    inquiry: VetInquiry,
    onRespond: () -> Unit
) {
    val (badgeBg, badgeColor, badgeLabel) = when (inquiry.urgency) {
        "HIGH" -> Triple(RoseRed.copy(alpha = 0.15f), RoseRed, "Urgent")
        "MEDIUM" -> Triple(GoldAmber.copy(alpha = 0.15f), GoldAmber, "Moderate")
        else -> Triple(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary, "Routine")
    }

    IslandCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        elevation = 3.dp,
        onClick = onRespond
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Pets,
                        contentDescription = "Animal",
                        tint = EmeraldPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = inquiry.cowTag,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = inquiry.farmerName,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            PillBadge(
                text = badgeLabel,
                containerColor = badgeBg,
                contentColor = badgeColor
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                .padding(12.dp)
        ) {
            Text(
                text = inquiry.symptoms,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                lineHeight = 18.sp
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Rounded.Schedule,
                    contentDescription = "Time",
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = inquiry.date,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }

            Button(
                onClick = onRespond,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Icon(Icons.Rounded.Healing, contentDescription = "Diagnose", modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Respond", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Vet Dashboard Light")
@Composable
fun VetDashboardPreview() {
    FMSTheme(darkTheme = false) {
        VetDashboard()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Vet Dashboard Dark")
@Composable
fun VetDashboardDarkPreview() {
    FMSTheme(darkTheme = true) {
        VetDashboard()
    }
}
