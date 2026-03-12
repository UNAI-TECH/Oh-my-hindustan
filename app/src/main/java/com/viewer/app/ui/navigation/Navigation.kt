package com.viewer.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.viewer.app.ui.screens.*

@Composable
fun NavigationGraph() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") { SplashScreen(navController) }
        composable("login") { LoginScreen(navController) }
        composable("signup") { SignUpScreen(navController) }
        composable("profile_setup") { ProfileSetupScreen(navController) }
        composable("interests_selection") { InterestsSelectionScreen(navController) }
        composable("home") { HomeFeedScreen(navController) }
        composable("article_detail/{articleId}") { backStackEntry -> 
            val articleId = backStackEntry.arguments?.getString("articleId")
            ArticleDetailScreen(navController, articleId) 
        }
        composable("explore") { ExploreScreen(navController) }
        composable("profile") { ProfileScreen(navController) }
        composable("creator_dashboard") { CreatorDashboardScreen(navController) }
        composable("content_editor") { ContentEditorScreen(navController) }
        composable("creator_analytics") { CreatorAnalyticsScreen(navController) }
        composable("admin_overview") { AdminOverviewScreen(navController) }
        composable("admin_monetization") { AdminMonetizationScreen(navController) }
    }
}
