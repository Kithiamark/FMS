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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.VetInquiry
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

data class OutbreakAlert(
    val id: String,
    val title: String,
    val disease: String,
    val county: String,
    val subCounty: String,
    val severity: String, // HIGH, MEDIUM, LOW
    val advisory: String,
    val dateReported: String
)

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

    var outbreakAlerts by remember {
        mutableStateOf(
            listOf(
                OutbreakAlert(
                    id = "ob1",
                    title = "Foot & Mouth Disease (FMD) Advisory",
                    disease = "Foot & Mouth (Type O)",
                    county = "Uasin Gishu",
                    subCounty = "Kapseret & Ainabkoi",
                    severity = "HIGH",
                    advisory = "Pause livestock trade corridors. Active ring vaccination deployed. Report any vesicle lesions or high salivation.",
                    dateReported = "Today, 08:30 AM"
                ),
                OutbreakAlert(
                    id = "ob2",
                    title = "Anthrax Quarantine Alert",
                    disease = "Bacillus anthracis",
                    county = "Kericho",
                    subCounty = "Bureti corridor",
                    severity = "HIGH",
                    advisory = "Prohibit carcass butchering or movement. Mandatory post-mortem exclusion and deep burial with quicklime.",
                    dateReported = "Yesterday"
                ),
                OutbreakAlert(
                    id = "ob3",
                    title = "Bovine Trypanosomiasis Seasonal Vector Surge",
                    disease = "Trypanosoma congolense",
                    county = "Nandi",
                    subCounty = "Tinderet lowlands",
                    severity = "MEDIUM",
                    advisory = "Apply deltamethrin pour-on fly repellents and conduct blood smear screenings for dull/anemic cattle.",
                    dateReported = "2 days ago"
                )
            )
        )
    }

    // Practitioner Credentials & Indemnity State
    var kvbLicenseNumber by remember { mutableStateOf("KVB-DVM-4102") }
    var indemnityValidUntil by remember { mutableStateOf("Dec 31, 2026") }
    var isIndemnityActive by remember { mutableStateOf(true) }
    var showRenewIndemnityModal by remember { mutableStateOf(false) }

    var selectedInquiryForAction by remember { mutableStateOf<VetInquiry?>(null) }
    var showWithdrawalCalculator by remember { mutableStateOf(false) }

    val listState = androidx.compose.foundation.lazy.rememberLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(bottom = 110.dp),
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Hero Header integrated seamlessly into scroll flow
            item {
                HeroHeader(
                    title = "Veterinary Clinical Desk",
                    subtitle = "Dr. Emmanuel Kiprono, DVM (KVB #4102)",
                    roleBadge = "VET DOCTOR"
                )
            }

            // 2. Practitioner Status & KVB Indemnity Inset Group
            item {
                InsetGroup(
                    header = "Practitioner Accreditation & Cover",
                    footer = "APA Professional Veterinary Indemnity Policy active through $indemnityValidUntil."
                ) {
                    InsetRow(
                        title = "KVB Registered Surgeon",
                        subtitle = "License: $kvbLicenseNumber",
                        leadingIcon = Icons.Rounded.VerifiedUser,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        trailingBadge = if (isIndemnityActive) "Cover Active" else "Expired",
                        badgeColor = if (isIndemnityActive) EmeraldPrimary else RoseRed,
                        showChevron = true,
                        onClick = { showRenewIndemnityModal = true }
                    )
                    InsetRow(
                        title = "Renew / Update Policy",
                        subtitle = "Annual KVB compliance renewal",
                        leadingIcon = Icons.Rounded.Refresh,
                        iconTint = ForestGreen,
                        iconBackgroundColor = ForestGreen.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = { showRenewIndemnityModal = true }
                    )
                }
            }

            // Segmented Tabs
            item {
                ScrollableTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = EmeraldPrimary,
                    edgePadding = 16.dp,
                    divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f)) }
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
                        text = { Text("Outbreak Alerts (${outbreakAlerts.size})", fontSize = 13.sp, fontWeight = if (selectedTab == 2) FontWeight.Bold else FontWeight.Medium) }
                    )
                    Tab(
                        selected = selectedTab == 3,
                        onClick = { selectedTab = 3 },
                        text = { Text("Drug Withdrawal", fontSize = 13.sp, fontWeight = if (selectedTab == 3) FontWeight.Bold else FontWeight.Medium) }
                    )
                }
            }

        // TAB 0: Cases Inset Group
        if (selectedTab == 0) {
            item {
                InsetGroup(
                    header = "Active Farm Inquiries (${inquiries.size})",
                    footer = "Tap any case to review reported symptoms and dispatch clinical prescription."
                ) {
                    inquiries.forEachIndexed { index, inquiry ->
                        val urgencyColor = when (inquiry.urgency) {
                            "HIGH" -> RoseRed
                            "MEDIUM" -> GoldAmber
                            else -> EmeraldPrimary
                        }

                        InsetRow(
                            title = "${inquiry.cowTag} · ${inquiry.farmerName}",
                            subtitle = "${inquiry.symptoms} (${inquiry.date})",
                            leadingIcon = Icons.AutoMirrored.Rounded.Chat,
                            iconTint = urgencyColor,
                            iconBackgroundColor = urgencyColor.copy(alpha = 0.12f),
                            trailingBadge = inquiry.urgency,
                            badgeColor = urgencyColor,
                            showChevron = true,
                            showDivider = index < inquiries.size - 1,
                            onClick = { selectedInquiryForAction = inquiry }
                        )
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
                                fontSize = 16.sp,
                                modifier = Modifier.weight(1f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.width(8.dp))
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

        // TAB 2: Outbreak Alerts Feed
        if (selectedTab == 2) {
            items(outbreakAlerts, key = { it.id }) { alert ->
                val (badgeBg, badgeColor) = when (alert.severity) {
                    "HIGH" -> Pair(RoseRed.copy(alpha = 0.15f), RoseRed)
                    "MEDIUM" -> Pair(GoldAmber.copy(alpha = 0.15f), GoldAmber)
                    else -> Pair(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary)
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
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = badgeBg,
                                    modifier = Modifier.size(34.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Rounded.NotificationImportant,
                                            contentDescription = null,
                                            tint = badgeColor,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                                Column {
                                    Text(
                                        text = alert.title,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "${alert.county} • ${alert.subCounty}",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            PillBadge(
                                text = "${alert.severity} SEVERITY",
                                containerColor = badgeBg,
                                contentColor = badgeColor
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "Pathogen: ${alert.disease}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = alert.advisory,
                                    fontSize = 12.sp,
                                    lineHeight = 17.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Reported: ${alert.dateReported}",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Button(
                                onClick = {
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(
                                            Intent.EXTRA_TEXT,
                                            "🚨 VET ADVISORY: ${alert.title}\nArea: ${alert.county} (${alert.subCounty})\n${alert.advisory}\n- Dr. Emmanuel Kiprono, DVM (KVB #4102)"
                                        )
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, "Broadcast Advisory"))
                                },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.AutoMirrored.Rounded.Send, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Broadcast Alert", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // TAB 3: Drug Withdrawal Calculator
        if (selectedTab == 3) {
            item {
                DrugWithdrawalToolSection()
            }
        }

        item {
            Spacer(modifier = Modifier.height(40.dp))
        }
    }

    // Prescription / Advice Bottom Sheet
    selectedInquiryForAction?.let { inquiry ->
        var adviceText by remember { mutableStateOf("") }
        var prescribeAntibiotic by remember { mutableStateOf(false) }
        var withdrawalHours by remember { mutableStateOf("72") }

        ModalBottomSheet(
            onDismissRequest = { selectedInquiryForAction = null },
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
                            text = "Clinical Assessment & Rx",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "KVB Official Statutory Clinical Order",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = "KVB Verified",
                        containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                        contentColor = EmeraldPrimary
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                InsetGroup(
                    header = "Patient Case Summary"
                ) {
                    InsetRow(
                        title = "Patient Tag",
                        subtitle = inquiry.cowTag,
                        trailingText = inquiry.farmerName,
                        showChevron = false,
                        showDivider = true
                    )
                    InsetRow(
                        title = "Reported Symptoms",
                        subtitle = inquiry.symptoms,
                        trailingBadge = inquiry.urgency,
                        badgeColor = when (inquiry.urgency) {
                            "HIGH" -> RoseRed
                            "MEDIUM" -> GoldAmber
                            else -> EmeraldPrimary
                        },
                        showChevron = false,
                        showDivider = false
                    )
                }

                OutlinedTextField(
                    value = adviceText,
                    onValueChange = { adviceText = it },
                    placeholder = { Text("Enter clinical diagnosis, prescribed medication, and dosage...") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text("Antibiotic Administered?", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        Text("Triggers statutory milk withholding period", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = prescribeAntibiotic,
                        onCheckedChange = { prescribeAntibiotic = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = EmeraldPrimary,
                            checkedTrackColor = EmeraldLight
                        )
                    )
                }

                if (prescribeAntibiotic) {
                    InsetGroup(
                        header = "Withdrawal Period Compliance"
                    ) {
                        InsetRow(
                            title = "Milk Discard Window (Hours)",
                            subtitle = "Mandatory cooling center rejection safeguard",
                            trailingText = "$withdrawalHours hrs",
                            showChevron = false,
                            showDivider = false
                        )
                    }

                    OutlinedTextField(
                        value = withdrawalHours,
                        onValueChange = { withdrawalHours = it },
                        label = { Text("Withholding Period (Hours)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = EmeraldPrimary,
                            cursorColor = EmeraldPrimary
                        )
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { selectedInquiryForAction = null },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            inquiries = inquiries.filter { it.id != inquiry.id }
                            selectedInquiryForAction = null
                        },
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Issue Clinical Order", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Professional Indemnity Renewal Bottom Sheet
    if (showRenewIndemnityModal) {
        var insurerName by remember { mutableStateOf("APA Insurance Kenya") }
        var policyNo by remember { mutableStateOf("POL-VET-2026-8891") }
        var coverageKes by remember { mutableStateOf("5,000,000") }

        ModalBottomSheet(
            onDismissRequest = { showRenewIndemnityModal = false },
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
                            text = "Renew Professional Indemnity",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Section 19 KVB Statutory Compliance",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = "KVB Mandate",
                        containerColor = ForestGreen.copy(alpha = 0.15f),
                        contentColor = ForestGreen
                    )
                }

                Text(
                    text = "Active professional indemnity is required under Section 19 of the Veterinary Surgeons and Veterinary Para-Professionals Act for clinical liability insurance.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                OutlinedTextField(
                    value = insurerName,
                    onValueChange = { insurerName = it },
                    label = { Text("Underwriter / Insurer") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = policyNo,
                    onValueChange = { policyNo = it },
                    label = { Text("Policy / Certificate Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = coverageKes,
                    onValueChange = { coverageKes = it },
                    label = { Text("Coverage Limit (KES)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showRenewIndemnityModal = false },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            isIndemnityActive = true
                            indemnityValidUntil = "Dec 31, 2027"
                            showRenewIndemnityModal = false
                        },
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Submit Policy Certificate", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
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
