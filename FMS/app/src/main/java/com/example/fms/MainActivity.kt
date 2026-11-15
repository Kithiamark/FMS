package com.example.fms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.fms.data.model.CattleRecord
import com.example.fms.data.model.UserRole
import com.example.fms.ui.components.navigation.BottomNavItem
import com.example.fms.ui.components.navigation.IslandBottomBar
import com.example.fms.ui.screens.admin.AdminDashboard
import com.example.fms.ui.screens.admin.AdminFarmersScreen
import com.example.fms.ui.screens.aggregator.AggregatorConnectionsScreen
import com.example.fms.ui.screens.aggregator.AggregatorDashboard
import com.example.fms.ui.screens.vet.VetDashboard
import com.example.fms.ui.screens.vet.VetRecordsScreen
import com.example.fms.ui.screens.WorkerDashboard
import com.example.fms.ui.screens.auth.LoginScreen
import com.example.fms.ui.screens.auth.OTPVerifyScreen
import com.example.fms.ui.screens.auth.RegisterScreen
import com.example.fms.ui.screens.auth.SplashScreen
import com.example.fms.ui.screens.farmer.FarmerDashboard
import com.example.fms.ui.screens.farmer.chat.FarmerChatScreen
import com.example.fms.ui.screens.farmer.community.CommunityScreen
import com.example.fms.ui.screens.farmer.finance.FinanceScreen
import com.example.fms.ui.screens.farmer.herd.AnimalDetailScreen
import com.example.fms.ui.screens.farmer.herd.HerdOverviewScreen
import com.example.fms.ui.screens.farmer.milk.DailyMilkEntryScreen
import com.example.fms.ui.screens.farmer.vets.FindVetScreen
import com.example.fms.ui.screens.settings.SettingsScreen
import com.example.fms.ui.screens.worker.MilkingKeypadScreen
import com.example.fms.ui.theme.FMSTheme

enum class AppDestination {
    SPLASH,
    LOGIN,
    REGISTER,
    OTP_VERIFY,
    MAIN_APP,
    DAILY_MILK_ENTRY,
    HERD_OVERVIEW,
    ANIMAL_DETAIL,
    FINANCE,
    FIND_VET,
    WORKER_KEYPAD,
    DIRECT_MESSAGE
}

enum class MainNavTab {
    DASHBOARD,
    SECONDARY, // Role-adaptive: Herd (Farmer), Tasks (Worker), Records (Vet), Connections (Aggregator), Farmers (Admin)
    COMMUNITY,
    MESSAGES,
    SETTINGS
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FMSTheme {
                AppRootNavigation()
            }
        }
    }
}

@Composable
fun AppRootNavigation() {
    var currentDestination by remember { mutableStateOf(AppDestination.SPLASH) }
    var activeRole by remember { mutableStateOf(UserRole.FARMER) }
    var pendingPhoneOrEmail by remember { mutableStateOf("+254 712 345 678") }
    var otpReason by remember { mutableStateOf("Login Authorization") }
    var selectedAnimal by remember { mutableStateOf<CattleRecord?>(null) }
    var directMessageRecipient by remember { mutableStateOf<String?>(null) }

    when (currentDestination) {
        AppDestination.SPLASH -> {
            SplashScreen(
                onSplashFinished = {
                    currentDestination = AppDestination.LOGIN
                }
            )
        }
        AppDestination.LOGIN -> {
            LoginScreen(
                onLoginSuccess = { phone, role ->
                    pendingPhoneOrEmail = phone
                    otpReason = "Sign In Security Verification"
                    currentDestination = AppDestination.OTP_VERIFY
                },
                onNavigateToRegister = {
                    currentDestination = AppDestination.REGISTER
                },
                onForgotPassword = {
                    pendingPhoneOrEmail = "your registered phone"
                    otpReason = "Password Reset"
                    currentDestination = AppDestination.OTP_VERIFY
                }
            )
        }
        AppDestination.REGISTER -> {
            RegisterScreen(
                onRegisterSuccess = { phone, role ->
                    pendingPhoneOrEmail = phone
                    activeRole = role
                    otpReason = "New Account Activation"
                    currentDestination = AppDestination.OTP_VERIFY
                },
                onNavigateToLogin = {
                    currentDestination = AppDestination.LOGIN
                },
                onBackClick = {
                    currentDestination = AppDestination.LOGIN
                }
            )
        }
        AppDestination.OTP_VERIFY -> {
            OTPVerifyScreen(
                phoneNumberOrEmail = pendingPhoneOrEmail,
                reason = otpReason,
                onOtpVerified = {
                    currentDestination = AppDestination.MAIN_APP
                },
                onResendOtp = {},
                onBackClick = {
                    currentDestination = AppDestination.LOGIN
                }
            )
        }
        else -> {
            // Main app frame with persistent IslandBottomBar
            MainAppShell(
                activeRole = activeRole,
                currentSubDestination = currentDestination,
                selectedAnimal = selectedAnimal,
                directMessageRecipient = directMessageRecipient,
                onRoleChanged = { activeRole = it },
                onNavigateTo = { currentDestination = it },
                onSelectAnimal = { animal ->
                    selectedAnimal = animal
                    currentDestination = AppDestination.ANIMAL_DETAIL
                },
                onOpenDirectMessage = { recipient ->
                    directMessageRecipient = recipient
                    currentDestination = AppDestination.DIRECT_MESSAGE
                },
                onLogout = {
                    currentDestination = AppDestination.LOGIN
                }
            )
        }
    }
}

@Composable
fun MainAppShell(
    activeRole: UserRole,
    currentSubDestination: AppDestination,
    selectedAnimal: CattleRecord?,
    directMessageRecipient: String?,
    onRoleChanged: (UserRole) -> Unit,
    onNavigateTo: (AppDestination) -> Unit,
    onSelectAnimal: (CattleRecord) -> Unit,
    onOpenDirectMessage: (String) -> Unit,
    onLogout: () -> Unit
) {
    var selectedNavTab by remember { mutableStateOf(MainNavTab.DASHBOARD) }

    // Role-adaptive bottom bar configuration matching web routes
    val secondaryTabConfig = when (activeRole) {
        UserRole.FARMER -> Pair("Herd", Icons.Rounded.Pets)
        UserRole.FARM_WORKER -> Pair("Keypad", Icons.Rounded.Dialpad)
        UserRole.VETERINARIAN -> Pair("Records", Icons.Rounded.Assignment)
        UserRole.AGGREGATOR -> Pair("Network", Icons.Rounded.Hub)
        UserRole.ADMIN -> Pair("Farms", Icons.Rounded.Domain)
    }

    val bottomNavItems = listOf(
        BottomNavItem(MainNavTab.DASHBOARD.name, "Home", Icons.Rounded.Dashboard),
        BottomNavItem(MainNavTab.SECONDARY.name, secondaryTabConfig.first, secondaryTabConfig.second),
        BottomNavItem(MainNavTab.COMMUNITY.name, "Feed", Icons.Rounded.Forum),
        BottomNavItem(MainNavTab.MESSAGES.name, "Chat", Icons.Rounded.ChatBubble, badgeCount = 1),
        BottomNavItem(MainNavTab.SETTINGS.name, "More", Icons.Rounded.Settings)
    )

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            IslandBottomBar(
                items = bottomNavItems,
                selectedId = selectedNavTab.name,
                onItemSelected = { selectedName ->
                    selectedNavTab = MainNavTab.valueOf(selectedName)
                    // If returning from sub-destination, navigate back to MAIN_APP
                    if (currentSubDestination != AppDestination.MAIN_APP) {
                        onNavigateTo(AppDestination.MAIN_APP)
                    }
                }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            if (currentSubDestination != AppDestination.MAIN_APP) {
                // Render sub-screens inside the shell so IslandBottomBar persists!
                when (currentSubDestination) {
                    AppDestination.DAILY_MILK_ENTRY -> {
                        DailyMilkEntryScreen(
                            onBackClick = { onNavigateTo(AppDestination.MAIN_APP) },
                            onSubmitSuccess = { onNavigateTo(AppDestination.MAIN_APP) }
                        )
                    }
                    AppDestination.HERD_OVERVIEW -> {
                        HerdOverviewScreen(
                            onBackClick = { onNavigateTo(AppDestination.MAIN_APP) },
                            onAnimalSelected = onSelectAnimal,
                            onAddAnimalClick = {}
                        )
                    }
                    AppDestination.ANIMAL_DETAIL -> {
                        AnimalDetailScreen(
                            cow = selectedAnimal ?: CattleRecord("1", "#104", "Bessie", "Friesian", "Healthy", 25.5),
                            onBackClick = { onNavigateTo(AppDestination.HERD_OVERVIEW) },
                            onLogMedicalEvent = { onNavigateTo(AppDestination.FIND_VET) }
                        )
                    }
                    AppDestination.FINANCE -> {
                        FinanceScreen(
                            onBackClick = { onNavigateTo(AppDestination.MAIN_APP) }
                        )
                    }
                    AppDestination.FIND_VET -> {
                        FindVetScreen(
                            onBackClick = { onNavigateTo(AppDestination.MAIN_APP) }
                        )
                    }
                    AppDestination.WORKER_KEYPAD -> {
                        MilkingKeypadScreen(
                            onBackClick = { onNavigateTo(AppDestination.MAIN_APP) }
                        )
                    }
                    AppDestination.DIRECT_MESSAGE -> {
                        FarmerChatScreen(
                            initialRecipient = directMessageRecipient,
                            onBackClick = { onNavigateTo(AppDestination.MAIN_APP) }
                        )
                    }
                    else -> {}
                }
            } else {
                // Main tab contents
                AnimatedContent(
                    targetState = selectedNavTab,
                    transitionSpec = {
                        fadeIn() + slideInVertically { it / 8 } togetherWith
                                fadeOut() + slideOutVertically { -it / 8 }
                    },
                    label = "MainTabAnimation"
                ) { tab ->
                    when (tab) {
                        MainNavTab.DASHBOARD -> {
                            when (activeRole) {
                                UserRole.FARMER -> FarmerDashboard(
                                    onNavigateToRecordMilk = { onNavigateTo(AppDestination.DAILY_MILK_ENTRY) },
                                    onNavigateToHerd = { onNavigateTo(AppDestination.HERD_OVERVIEW) },
                                    onNavigateToFinance = { onNavigateTo(AppDestination.FINANCE) }
                                )
                                UserRole.FARM_WORKER -> WorkerDashboard(
                                    onNavigateToMilkLog = { onNavigateTo(AppDestination.WORKER_KEYPAD) }
                                )
                                UserRole.VETERINARIAN -> VetDashboard()
                                UserRole.AGGREGATOR -> AggregatorDashboard()
                                UserRole.ADMIN -> AdminDashboard()
                            }
                        }
                        MainNavTab.SECONDARY -> {
                            when (activeRole) {
                                UserRole.FARMER -> HerdOverviewScreen(
                                    onBackClick = { selectedNavTab = MainNavTab.DASHBOARD },
                                    onAnimalSelected = onSelectAnimal
                                )
                                UserRole.FARM_WORKER -> MilkingKeypadScreen(
                                    onBackClick = { selectedNavTab = MainNavTab.DASHBOARD }
                                )
                                UserRole.VETERINARIAN -> VetRecordsScreen(
                                    onBackClick = { selectedNavTab = MainNavTab.DASHBOARD }
                                )
                                UserRole.AGGREGATOR -> AggregatorConnectionsScreen(
                                    onBackClick = { selectedNavTab = MainNavTab.DASHBOARD }
                                )
                                UserRole.ADMIN -> AdminFarmersScreen(
                                    onBackClick = { selectedNavTab = MainNavTab.DASHBOARD }
                                )
                            }
                        }
                        MainNavTab.COMMUNITY -> {
                            CommunityScreen(
                                onOpenDirectMessage = onOpenDirectMessage
                            )
                        }
                        MainNavTab.MESSAGES -> {
                            FarmerChatScreen()
                        }
                        MainNavTab.SETTINGS -> {
                            SettingsScreen(
                                currentRole = activeRole,
                                onRoleChanged = onRoleChanged,
                                onLogoutClick = onLogout
                            )
                        }
                    }
                }
            }
        }
    }
}
