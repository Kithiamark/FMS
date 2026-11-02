package com.example.fms.data.network

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    // Production live server on Render, fallback to local dev host
    private const val PROD_BASE_URL = "https://fms-gf57.onrender.com/"
    private const val DEV_BASE_URL = "http://10.0.2.2:8000/"

    // Default to live production endpoint
    var currentBaseUrl: String = PROD_BASE_URL
        private set

    private var authToken: String? = null

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private var cachedApiService: FmsApiService? = null

    fun useLiveServer() {
        if (currentBaseUrl != PROD_BASE_URL) {
            currentBaseUrl = PROD_BASE_URL
            cachedApiService = null
        }
    }

    fun useLocalDevServer() {
        if (currentBaseUrl != DEV_BASE_URL) {
            currentBaseUrl = DEV_BASE_URL
            cachedApiService = null
        }
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val builder = original.newBuilder()
        authToken?.let { token ->
            builder.header("Authorization", "Bearer $token")
        }
        builder.header("Accept", "application/json")
        chain.proceed(builder.build())
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    val apiService: FmsApiService
        get() {
            val existing = cachedApiService
            if (existing != null) return existing

            val newService = Retrofit.Builder()
                .baseUrl(currentBaseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(FmsApiService::class.java)

            cachedApiService = newService
            return newService
        }
}
