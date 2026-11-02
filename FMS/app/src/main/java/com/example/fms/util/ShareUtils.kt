package com.example.fms.util

import android.content.Context
import android.content.Intent

object ShareUtils {
    /**
     * Build deep link for a post
     */
    fun getPostDeepLink(postId: String): String {
        return "https://fms-dairy.onrender.com/community/post/$postId"
    }

    /**
     * Share post via WhatsApp or generic Android sharesheet
     */
    fun sharePost(
        context: Context,
        postId: String,
        authorName: String,
        contentSnippet: String,
        targetWhatsApp: Boolean = false
    ) {
        val link = getPostDeepLink(postId)
        val shareMessage = "🐄 *FMS Dairy Community Update* by $authorName:\n\n\"$contentSnippet\"\n\nRead & discuss in FMS: $link"

        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, shareMessage)
            type = "text/plain"
            if (targetWhatsApp) {
                setPackage("com.whatsapp")
            }
        }

        try {
            if (targetWhatsApp) {
                context.startActivity(sendIntent)
            } else {
                val chooser = Intent.createChooser(sendIntent, "Share Dairy Post via")
                context.startActivity(chooser)
            }
        } catch (_: Exception) {
            // Fallback to standard chooser if WhatsApp is not installed
            val fallbackChooser = Intent.createChooser(
                Intent().apply {
                    action = Intent.ACTION_SEND
                    putExtra(Intent.EXTRA_TEXT, shareMessage)
                    type = "text/plain"
                },
                "Share Dairy Post via"
            )
            context.startActivity(fallbackChooser)
        }
    }
}
