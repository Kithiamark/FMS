package com.example.fms.ui.screens.vet

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Chat
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.VetInquiry
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class ScheduledVisit(
    val id: String,
    val farmName: String,
    val farmerName: String,
    val farmerPhone: String,
    val cowTag: String,
    val scheduledTime: String,
    val location: String,
    val reason: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VetDashboard() {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Cases/Inquiries, 1: Farm Visits, 2: Drug Withdrawal Tool

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

    var scheduledVisits by remember {
        mutableStateOf(
            listOf(
                ScheduledVisit(
                    id = "sv1",
                    farmName = "Baraka Dairy Farm",
                    farmerName = "Mark Kipkorir",
                    farmerPhone = "+254712345678",
                    cowTag = "COW-#104 (Bessie)",
                    scheduledTime = "Today, 02:30 PM",
                    location = "Eldoret, Chepkoilel Route",
                    reason = "Quarter swelling & mastitis inspection"
                ),
                ScheduledVisit(
                    id = "sv2",
                    farmName = "Highland Pastures",
                    farmerName = "Faith Chepkemoi",
                    farmerPhone = "+254722987654",
                    cowTag = "HERD (25 Cows)",
                    scheduledTime = "Tomorrow, 09:00 AM",
                    location = "Kapsabet Road, Farm #4",
                    reason = "Annual Foot & Mouth Booster"
                )
            )
        )
    }

    var selectedInquiryForAction by remember { mutableStateOf<VetInquiry?>(null) }
    var showWithdrawalCalculator by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Hero Header
        item {
            HeroHeader(
                title = "Veterinary Clinical Desk",
                subtitle = "Dr. Emmanuel Kiprono, DVM (KVB #4102)"
            )
        }

        // Segmented Tabs
        item {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = EmeraldPrimary,
                divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f)) },
                modifier = Modifier.padding(horizontal = 16.dp)
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Clinical Cases (${inquiries.size})", fontSize = 13.sp, fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Farm Visits (${scheduledVisits.size})", fontSize = 13.sp, fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium) }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("Drug Withdrawal", fontSize = 13.sp, fontWeight = if (selectedTab == 2) FontWeight.Bold else FontWeight.Medium) }
                )
            }
        }

        // TAB 0: Cases
        if (selectedTab == 0) {
            items(inquiries, key = { it.id }) { inquiry ->
                val urgencyBadge = when (inquiry.urgency) {
                    "HIGH" -> Triple(RoseRed.copy(alpha = 0.15f), RoseRed, "EMERGENCY")
                    "MEDIUM" -> Triple(GoldAmber.copy(alpha = 0.15f), GoldAmber, "ATTENTION")
                    else -> Triple(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary, "ROUTINE")
                }

                IslandCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = inquiry.cowTag,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            PillBadge(
                                text = urgencyBadge.third,
                                containerColor = urgencyBadge.first,
                                contentColor = urgencyBadge.second
                            )
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = inquiry.farmerName,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = EmeraldPrimary
                            )
                            Text(
                                text = "· ${inquiry.date}",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Text(
                            text = inquiry.symptoms,
                            fontSize = 13.sp,
                            lineHeight = 18.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                                        data = Uri.parse("tel:+254712345678")
                                    }
                                    context.startActivity(dialIntent)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Rounded.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Call", fontSize = 12.sp)
                            }

                            Button(
                                onClick = { selectedInquiryForAction = inquiry },
                                modifier = Modifier.weight(1.5f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                            ) {
                                Icon(Icons.AutoMirrored.Rounded.Chat, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Prescribe / Advise", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // TAB 1: Scheduled Visits
        if (selectedTab == 1) {
            items(scheduledVisits, key = { it.id }) { visit ->
                IslandCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = visit.farmName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            PillBadge(
                                text = visit.scheduledTime,
                                containerColor = SkyBlue.copy(alpha = 0.15f),
                                contentColor = SkyBlue
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Rounded.LocationOn, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(16.dp))
                            Text(text = visit.location, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        Text(
                            text = "Target: ${visit.cowTag} · ${visit.reason}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                                        data = Uri.parse("tel:${visit.farmerPhone}")
                                    }
                                    context.startActivity(dialIntent)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Rounded.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Call", fontSize = 12.sp)
                            }

                            Button(
                                onClick = {
                                    val mapIntent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(visit.location)}"))
                                    context.startActivity(mapIntent)
                                },
                                modifier = Modifier.weight(1.5f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                            ) {
                                Icon(Icons.Rounded.Navigation, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Start Route", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // TAB 2: Drug Withdrawal Calculator
        if (selectedTab == 2) {
            item {
                DrugWithdrawalToolSection()
            }
        }

        item {
            Spacer(modifier = Modifier.height(40.dp))
        }
    }

    // Prescription / Advice Dialog
    selectedInquiryForAction?.let { inquiry ->
        var adviceText by remember { mutableStateOf("") }
        var prescribeAntibiotic by remember { mutableStateOf(false) }
        var withdrawalHours by remember { mutableStateOf("72") }

        AlertDialog(
            onDismissRequest = { selectedInquiryForAction = null },
            title = { Text("Clinical Assessment", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Patient: ${inquiry.cowTag} (${inquiry.farmerName})", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = adviceText,
                        onValueChange = { adviceText = it },
                        placeholder = { Text("Enter diagnosis and prescription dosage...") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Antibiotic Administered?", fontSize = 13.sp)
                        Switch(
                            checked = prescribeAntibiotic,
                            onCheckedChange = { prescribeAntibiotic = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = EmeraldPrimary)
                        )
                    }

                    if (prescribeAntibiotic) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text("Milk Discard Period (hrs):", fontSize = 12.sp)
                            OutlinedTextField(
                                value = withdrawalHours,
                                onValueChange = { withdrawalHours = it },
                                modifier = Modifier.width(90.dp),
                                singleLine = true,
                                shape = RoundedCornerShape(8.dp)
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        inquiries = inquiries.filter { it.id != inquiry.id }
                        selectedInquiryForAction = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Text("Issue Clinical Order")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedInquiryForAction = null }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
fun DrugWithdrawalToolSection() {
    val commonDrugs = listOf(
        Pair("Oxytetracycline 20% L.A.", "Milk: 7 days (168h) • Meat: 21 days"),
        Pair("Penicillin-Streptomycin", "Milk: 3 days (72h) • Meat: 14 days"),
        Pair("Tilmicosin (Micotil)", "Milk: Discard completely • Meat: 28 days"),
        Pair("Ivermectin Injection", "Milk: 28 days • Meat: 35 days"),
        Pair("Flunixin Meglumine (NSAID)", "Milk: 36 hours • Meat: 4 days")
    )

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
                Text("Milk Withdrawal Reference", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                PillBadge("KVB Compliance", containerColor = ForestGreen.copy(alpha = 0.15f), contentColor = ForestGreen)
            }

            Text(
                text = "Ensure farmers do not deliver milk containing antimicrobial residues to the cooling center to prevent batch rejection.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            commonDrugs.forEach { (drug, withdrawal) ->
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(text = drug, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text(text = withdrawal, fontSize = 12.sp, color = RoseRed, fontWeight = FontWeight.SemiBold)
                    }
                }
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
