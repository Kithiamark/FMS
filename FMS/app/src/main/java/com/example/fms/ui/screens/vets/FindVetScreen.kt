package com.example.fms.ui.screens.vets

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
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.IslandButton
import com.example.fms.ui.components.IslandCard
import com.example.fms.ui.components.PillBadge
import com.example.fms.ui.theme.*

data class VetDoctor(
    val id: String,
    val name: String,
    val title: String,
    val distanceKm: Double,
    val rating: Double,
    val reviewsCount: Int,
    val phone: String,
    val specialty: String,
    val isAvailable: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FindVetScreen(
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedVetForBooking by remember { mutableStateOf<VetDoctor?>(null) }
    var bookingReason by remember { mutableStateOf("") }
    var bookingDate by remember { mutableStateOf("Tomorrow, 10:00 AM") }
    var showBookingSuccess by remember { mutableStateOf(false) }

    val vets = remember {
        listOf(
            VetDoctor(
                id = "vet1",
                name = "Dr. Emmanuel Kiprono, BVM",
                title = "Senior Bovine Specialist",
                distanceKm = 4.2,
                rating = 4.9,
                reviewsCount = 48,
                phone = "+254712345678",
                specialty = "Mastitis, Artificial Insemination & Surgery",
                isAvailable = true
            ),
            VetDoctor(
                id = "vet2",
                name = "Dr. Sarah Wangari, DVM",
                title = "Livestock Clinical Officer",
                distanceKm = 7.8,
                rating = 4.8,
                reviewsCount = 34,
                phone = "+254723456789",
                specialty = "Vaccinations, Calf Health & Nutrition",
                isAvailable = true
            ),
            VetDoctor(
                id = "vet3",
                name = "Dr. Joshua Mutua, BVM",
                title = "Emergency Herd Vet",
                distanceKm = 12.5,
                rating = 4.7,
                reviewsCount = 22,
                phone = "+254734567890",
                specialty = "Difficult Calving (Dystocia) & Triage",
                isAvailable = false
            )
        )
    }

    val filteredVets = vets.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
                it.specialty.contains(searchQuery, ignoreCase = true)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Veterinary Directory",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Licensed Bovine Practitioners",
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
            // Search Input Island
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Search,
                        contentDescription = "Search",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search by name or clinical specialty...", fontSize = 13.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        ),
                        singleLine = true
                    )
                }
            }

            // Emergency Hotline Card
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = RoseRed.copy(alpha = 0.12f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, RoseRed.copy(alpha = 0.3f))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = CircleShape,
                                color = RoseRed,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Rounded.Emergency,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "24/7 Clinical Emergency Hotline",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Immediate dispatch for dystocia or acute bloat",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        IconButton(onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:999"))
                            context.startActivity(intent)
                        }) {
                            Icon(Icons.Rounded.Call, contentDescription = "Emergency Call", tint = RoseRed)
                        }
                    }
                }
            }

            // Directory List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(filteredVets) { vet ->
                    VetCardItem(
                        vet = vet,
                        onCall = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${vet.phone}"))
                            context.startActivity(intent)
                        },
                        onBookVisit = {
                            selectedVetForBooking = vet
                        }
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }

    // Book Farm Visit Dialog
    if (selectedVetForBooking != null) {
        val vet = selectedVetForBooking!!
        AlertDialog(
            onDismissRequest = { selectedVetForBooking = null },
            icon = {
                Icon(
                    imageVector = Icons.Rounded.CalendarToday,
                    contentDescription = null,
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(40.dp)
                )
            },
            title = {
                Text(
                    text = "Book Visit: ${vet.name}",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Specify symptoms or consultation reason for this on-farm visit.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedTextField(
                        value = bookingReason,
                        onValueChange = { bookingReason = it },
                        label = { Text("Reason (e.g. Mastitis check on Cow #104)") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = bookingDate,
                        onValueChange = { bookingDate = it },
                        label = { Text("Preferred Arrival Date & Time") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        selectedVetForBooking = null
                        showBookingSuccess = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Confirm Appointment")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedVetForBooking = null }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }

    if (showBookingSuccess) {
        AlertDialog(
            onDismissRequest = { showBookingSuccess = false },
            icon = {
                Icon(
                    imageVector = Icons.Rounded.CheckCircle,
                    contentDescription = null,
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(44.dp)
                )
            },
            title = {
                Text(
                    text = "Visit Request Dispatched",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    textAlign = TextAlign.Center
                )
            },
            text = {
                Text(
                    text = "Your booking request has been sent to the practitioner. You will receive an SMS and push confirmation once approved.",
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            confirmButton = {
                Button(
                    onClick = { showBookingSuccess = false },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Done")
                }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
fun VetCardItem(
    vet: VetDoctor,
    onCall: () -> Unit,
    onBookVisit: () -> Unit
) {
    IslandCard(
        modifier = Modifier.fillMaxWidth(),
        elevation = 3.dp
    ) {
        Column(modifier = Modifier.padding(2.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = EmeraldPrimary.copy(alpha = 0.12f),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Rounded.MedicalServices,
                                contentDescription = null,
                                tint = EmeraldPrimary,
                                modifier = Modifier.size(26.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = vet.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = vet.title,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                PillBadge(
                    text = "${vet.distanceKm} km away",
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = MaterialTheme.colorScheme.onSurface
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Specialty
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.HealthAndSafety,
                        contentDescription = null,
                        tint = EmeraldPrimary,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = vet.specialty,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Rounded.Star,
                        contentDescription = null,
                        tint = GoldAmber,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${vet.rating}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = " (${vet.reviewsCount} reviews)",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalIconButton(
                        onClick = onCall,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Rounded.Call, contentDescription = "Call Vet", tint = EmeraldPrimary)
                    }

                    Button(
                        onClick = onBookVisit,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text("Book Visit", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Find Vet Light")
@Composable
fun FindVetScreenPreview() {
    FMSTheme(darkTheme = false) {
        FindVetScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Find Vet Dark")
@Composable
fun FindVetScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        FindVetScreen()
    }
}
