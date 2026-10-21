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
import com.example.fms.ui.screens.farmer.DailyMilkEntryScreen
import com.example.fms.ui.theme.FMSTheme

enum class AppDestination {
    SPLASH,
    LOGIN,
    REGISTER,
    OTP_VERIFY,
    MAIN_APP,
    DAILY_MILK_ENTRY
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
                    initialRole = activeRole,
                    onNavigateToMilkEntry = {
                        currentDestination = AppDestination.DAILY_MILK_ENTRY
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
        }
    }
}

@Composable
fun FMSApp(
    initialRole: UserRole = UserRole.FARMER,
    onNavigateToMilkEntry: () -> Unit = {},
    onLogout: () -> Unit = {}
) {
    var activeRole by remember { mutableStateOf(initialRole) }

    val bottomNavItems = listOf(
        BottomNavItem(UserRole.FARMER.name, "Farmer", Icons.Rounded.Agriculture),
        BottomNavItem(UserRole.FARM_WORKER.name, "Worker", Icons.Rounded.Engineering),
        BottomNavItem(UserRole.VETERINARIAN.name, "Vet", Icons.Rounded.MedicalServices),
        BottomNavItem(UserRole.AGGREGATOR.name, "Buyer", Icons.Rounded.Storefront)
    )

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            IslandBottomBar(
                items = bottomNavItems,
                selectedId = activeRole.name,
                onItemSelected = { selectedName ->
                    activeRole = UserRole.valueOf(selectedName)
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
                targetState = activeRole,
                transitionSpec = {
                    fadeIn() + slideInVertically { it / 6 } togetherWith
                            fadeOut() + slideOutVertically { -it / 6 }
                },
                label = "RoleDashboardAnimation"
            ) { role ->
                when (role) {
                    UserRole.FARMER -> FarmerDashboard(
                        onNavigateToRecordMilk = onNavigateToMilkEntry
                    )
                    UserRole.FARM_WORKER -> WorkerDashboard(
                        onNavigateToMilkLog = onNavigateToMilkEntry
                    )
                    UserRole.VETERINARIAN -> VetDashboard()
                    UserRole.AGGREGATOR -> AggregatorDashboard()
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
