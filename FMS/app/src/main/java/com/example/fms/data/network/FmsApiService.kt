package com.example.fms.data.network

import com.google.gson.annotations.SerializedName
import retrofit2.Response
import retrofit2.http.*

data class MilkAllocationDto(
    @SerializedName("date") val date: String,
    @SerializedName("calf_litres") val calfLitres: Double,
    @SerializedName("home_use_litres") val homeUseLitres: Double,
    @SerializedName("sold_litres") val soldLitres: Double,
    @SerializedName("direct_retail_litres") val directRetailLitres: Double = 0.0,
    @SerializedName("spoilage_litres") val spoilageLitres: Double = 0.0,
    @SerializedName("notes") val notes: String = ""
)

data class FarmTaskDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("status") val status: String,
    @SerializedName("due_time") val dueTime: String,
    @SerializedName("assigned_to") val assignedTo: String
)

data class OutbreakAlertDto(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("disease") val disease: String,
    @SerializedName("county") val county: String,
    @SerializedName("sub_county") val subCounty: String,
    @SerializedName("severity") val severity: String,
    @SerializedName("advisory") val advisory: String,
    @SerializedName("date_reported") val dateReported: String
)

data class AIRecommendationsResponse(
    @SerializedName("summary") val summary: Map<String, Any>,
    @SerializedName("recommendations") val recommendations: List<Map<String, Any>>
)

interface FmsApiService {
    @GET("api/v1/tasks/")
    suspend fun getFarmTasks(): Response<List<FarmTaskDto>>

    @POST("api/v1/tasks/")
    suspend fun createFarmTask(@Body task: FarmTaskDto): Response<FarmTaskDto>

    @POST("api/v1/milk/allocate/")
    suspend fun saveMilkAllocation(@Body allocation: MilkAllocationDto): Response<Map<String, Any>>

    @GET("api/v1/alerts/")
    suspend fun getNearbyOutbreaks(@Query("county") county: String = "Uasin Gishu"): Response<List<OutbreakAlertDto>>

    @GET("api/v1/ai/recommendations/")
    suspend fun getAIRecommendations(): Response<AIRecommendationsResponse>
}
