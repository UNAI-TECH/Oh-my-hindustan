package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.WarmOrange

@Composable
fun SplashScreen(navController: NavController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Logo Placeholder Box
        Box(
            modifier = Modifier
                .width(320.dp)
                .aspectRatio(1f)
                .padding(16.dp)
                .background(PrimaryRed.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                .border(1.dp, PrimaryRed.copy(alpha = 0.2f), RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center
        ) {
            AsyncImage(
                model = "https://lh3.googleusercontent.com/aida-public/AB6AXuDfPpBi7n7KtkXvzgbNg5DbRu2UTV4kGF5wR0fFLc1ZPmue3yutAOInzZRMZrnV5yHUqTrZsjZ7mvNUXA3uIEPSPxajGg4I9AiBedesosZ3m0hYge4drLEHS_eoK936wmYTVx4QtiXbSJVhVZGtkYr0pnSgWmOGIavhdci826FW_Gm6R4kn9lPSoRmhlJc0YGWOmc5VT-M2VcorrPztunE3eYp-hCX8EHXO5i3nB_ey6UPejit43I72OVSEr1nuQn2AqRhTMWXbNkfF",
                contentDescription = "Logo Image",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            Icon(
                imageVector = Icons.Default.PlayCircle,
                contentDescription = null,
                modifier = Modifier.size(60.dp),
                tint = PrimaryRed.copy(alpha = 0.2f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Cinema in your pocket.",
            style = MaterialTheme.typography.displayLarge.copy(
                fontSize = 30.sp,
                textAlign = TextAlign.Center
            ),
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Discover, watch, and share the best short films from around the globe.",
            style = MaterialTheme.typography.bodyLarge.copy(
                color = Color.Gray,
                textAlign = TextAlign.Center
            ),
            modifier = Modifier.padding(horizontal = 32.dp)
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Action Buttons
        Button(
            onClick = { navController.navigate("home") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp)
                .height(56.dp),
            contentPadding = PaddingValues(0.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.horizontalGradient(listOf(PrimaryRed, WarmOrange)),
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text("Sign Up", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedButton(
            onClick = { navController.navigate("login") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp)
                .height(56.dp),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(2.dp, PrimaryRed),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryRed)
        ) {
            Text("Log In", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(24.dp))

        TextButton(onClick = { navController.navigate("home") }) {
            Text(
                "Continue as Guest",
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Medium,
                    textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline,
                    color = Color.Gray
                )
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Decorative Bottom Element
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(2.dp)
                .background(
                    Brush.horizontalGradient(
                        listOf(
                            PrimaryRed.copy(alpha = 0.05f),
                            PrimaryRed.copy(alpha = 0.2f),
                            PrimaryRed.copy(alpha = 0.05f)
                        )
                    )
                )
        )
    }
}
