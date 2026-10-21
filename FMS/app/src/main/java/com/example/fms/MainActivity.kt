package com.example.fms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.fms.data.model.CattleRecord
import com.example.fms.data.model.UserRole
import com.example.fms.ui.components.BottomNavItem
import com.example.fms.ui.components.IslandBottomBar
import com.example.fms.ui.screens.AggregatorDashboard
import com.example.fms.ui.screens.FarmerDashboard
import com.example.fms.ui.screens.VetDashboard
import com.example.fms.ui.screens.WorkerDashboard
import com.example.fms.ui.screens.auth.LoginScreen
import com.example.fms.ui.screens.auth.OTPVerifyScreen
import com.example.fms.ui.screens.auth.RegisterScreen
import com.example.fms.ui.screens.auth.SplashScreen
import com.example.fms.ui.screens.chat.ChatScreen
import com.example.fms.ui.screens.community.CommunityScreen
import com.example.fms.ui.screens.farmer.DailyMilkEntryScreen
import com.example.fms.ui.screens.finance.FinanceScreen
import com.example.fms.ui.screens.herd.AnimalDetailScreen
import com.example.fms.ui.screens.herd.HerdOverviewScreen
import com.example.fms.ui.screens.settings.SettingsScreen
import com.example.fms.ui.screens.vets.FindVetScreen
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
    HERD,
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

    AnimatedContent(
        targetState = currentDestination,
        transitionSpec = {
            fadeIn() togetherWith fadeOut()
        },
        label = "AppRootNavigation"
    ) { destination ->
        when (destination) {
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
                    onOtpVerified = { code ->
                        currentDestination = AppDestination.MAIN_APP
                    },
                    onResendOtp = {},
                    onBackClick = {
                        currentDestination = AppDestination.LOGIN
                    }
                )
            }
            AppDestination.MAIN_APP -> {
                FMSApp(
                    activeRole = activeRole,
                    onRoleChanged = { activeRole = it },
                    onNavigateToMilkEntry = {
                        currentDestination = AppDestination.DAILY_MILK_ENTRY
                    },
                    onNavigateToHerd = {
                        currentDestination = AppDestination.HERD_OVERVIEW
                    },
                    onNavigateToFinance = {
                        currentDestination = AppDestination.FINANCE
                    },
                    onNavigateToFindVet = {
                        currentDestination = AppDestination.FIND_VET
                    },
                    onNavigateToWorkerKeypad = {
                        currentDestination = AppDestination.WORKER_KEYPAD
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
            AppDestination.DAILY_MILK_ENTRY -> {
                DailyMilkEntryScreen(
                    onBackClick = {
                        currentDestination = AppDestination.MAIN_APP
                    },
                    onSubmitSuccess = {
                        currentDestination = AppDestination.MAIN_APP
                    }
                )
            }
            AppDestination.HERD_OVERVIEW -> {
                HerdOverviewScreen(
                    onBackClick = {
                        currentDestination = AppDestination.MAIN_APP
                    },
                    onAnimalSelected = { cow ->
                        selectedAnimal = cow
                        currentDestination = AppDestination.ANIMAL_DETAIL
                    },
                    onAddAnimalClick = {}
                )
            }
            AppDestination.ANIMAL_DETAIL -> {
                AnimalDetailScreen(
                    cow = selectedAnimal ?: CattleRecord("1", "#104", "Bessie", "Friesian", "Healthy", 25.5),
                    onBackClick = {
                        currentDestination = AppDestination.HERD_OVERVIEW
                    },
                    onLogMedicalEvent = {
                        currentDestination = AppDestination.FIND_VET
                    }
                )
            }
            AppDestination.FINANCE -> {
                FinanceScreen(
                    onBackClick = {
                        currentDestination = AppDestination.MAIN_APP
                    }
                )
            }
            AppDestination.FIND_VET -> {
                FindVetScreen(
                    onBackClick = {
                        currentDestination = AppDestination.MAIN_APP
                    }
                )
            }
            AppDestination.WORKER_KEYPAD -> {
                MilkingKeypadScreen(
                    onBackClick = {
                        currentDestination = AppDestination.MAIN_APP
                    }
                )
            }
            AppDestination.DIRECT_MESSAGE -> {
                ChatScreen(
                    initialRecipient = directMessageRecipient,
                    onBackClick = {
                        currentDestination = AppDestination.MAIN_APP
                    }
                )
            }
        }
    }
}

@Composable
fun FMSApp(
    activeRole: UserRole = UserRole.FARMER,
    onRoleChanged: (UserRole) -> Unit = {},
    onNavigateToMilkEntry: () -> Unit = {},
    onNavigateToHerd: () -> Unit = {},
    onNavigateToFinance: () -> Unit = {},
    onNavigateToFindVet: () -> Unit = {},
    onNavigateToWorkerKeypad: () -> Unit = {},
    onOpenDirectMessage: (String) -> Unit = {},
    onLogout: () -> Unit = {}
) {
    var selectedNavTab by remember { mutableStateOf(MainNavTab.DASHBOARD) }

    val bottomNavItems = listOf(
        BottomNavItem(MainNavTab.DASHBOARD.name, "Home", Icons.Rounded.Dashboard),
        BottomNavItem(MainNavTab.HERD.name, "Herd", Icons.Rounded.Pets),
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
                }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            AnimatedContent(
                targetState = selectedNavTab,
                transitionSpec = {
                    fadeIn() + slideInVertically { it / 6 } togetherWith
                            fadeOut() + slideOutVertically { -it / 6 }
                },
                label = "MainTabAnimation"
            ) { tab ->
                when (tab) {
                    MainNavTab.DASHBOARD -> {
                        when (activeRole) {
                            UserRole.FARMER -> FarmerDashboard(
                                onNavigateToRecordMilk = onNavigateToMilkEntry,
                                onNavigateToHerd = onNavigateToHerd,
                                onNavigateToFinance = onNavigateToFinance
                            )
                            UserRole.FARM_WORKER -> WorkerDashboard(
                                onNavigateToMilkLog = onNavigateToWorkerKeypad
                            )
                            UserRole.VETERINARIAN -> VetDashboard()
                            UserRole.AGGREGATOR -> AggregatorDashboard()
                        }
                    }
                    MainNavTab.HERD -> {
                        HerdOverviewScreen(
                            onBackClick = { selectedNavTab = MainNavTab.DASHBOARD },
                            onAnimalSelected = { cow ->
                                onNavigateToHerd()
                            }
                        )
                    }
                    MainNavTab.COMMUNITY -> {
                        CommunityScreen(
                            onOpenDirectMessage = onOpenDirectMessage
                        )
                    }
                    MainNavTab.MESSAGES -> {
                        ChatScreen()
                    }
                    MainNavTab.SETTINGS -> {
                        SettingsScreen(
                            currentRole = activeRole,
                            onRoleChanged = { newRole ->
                                onRoleChanged(newRole)
                            },
                            onLogoutClick = onLogout
                        )
                    }
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "FMS App Main Light")
@Composable
fun FMSAppPreview() {
    FMSTheme(darkTheme = false) {
        FMSApp()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "FMS App Main Dark")
@Composable
fun FMSAppDarkPreview() {
    FMSTheme(darkTheme = true) {
        FMSApp()
    }
}
