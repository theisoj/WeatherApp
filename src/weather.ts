import axios from "axios"

/**
   * Get the weather data based on the user's location
   * @param lat Latitude
   * @param lon Longitude
   * @param timezone Timezone
   */

type Weather = {
  current: {
    temperature_2m: number
    wind_speed_10m: number
    weather_code: number
    time: number
  }
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    apparent_temperature_max: number[]
    apparent_temperature_min: number[]
    precipitation_sum: number[]
    time: number[]
    weather_code: number[]
  }
  hourly: {
    time: number[]
    weather_code: number[]
    temperature_2m: number[]
    apparent_temperature: number[]
    wind_speed_10m: number[]
    precipitation: number[]
  }
}

// https://api.open-meteo.com/v1/forecast?latitude=60.3095&longitude=24.7038&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&wind_speed_unit=ms&timeformat=unixtime&timezone=auto

export async function getWeather(latitude: number, longitude: number, timezone: string) {
  const { data } = await axios
    .get<Weather>(
      "https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum&wind_speed_unit=ms&timeformat=unixtime",
      {
        params: {
          latitude,
          longitude,
          timezone
        },
      }
    )
  return {
    current: parseCurrentWeather(data),
    daily: parseDailyWeather(data),
    hourly: parseHourlyWeather(data),
  }
}

type ParseCurrentWeather = {
  current: {
    temperature_2m: number
    wind_speed_10m: number
    weather_code: number
    time: number
  }
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    apparent_temperature_max: number[]
    apparent_temperature_min: number[]
    precipitation_sum: number[]
  }
}

/**
 * Parse the current weather data
 * @param current_weather Current weather data
 * @param daily Daily weather data
 * @returns Parsed weather data
 */

function parseCurrentWeather({ current, daily }: ParseCurrentWeather) {
  const {
    temperature_2m: currentTemp,
    wind_speed_10m: windSpeed,
    weather_code: iconCode,
  } = current
  const {
    temperature_2m_max: [maxTemp],
    temperature_2m_min: [minTemp],
    apparent_temperature_max: [maxFeelsLike],
    apparent_temperature_min: [minFeelsLike],
    precipitation_sum: [precip],
  } = daily

  return {
    currentTemp: Math.round(currentTemp),
    highTemp: Math.round(maxTemp),
    lowTemp: Math.round(minTemp),
    highFeelsLike: Math.round(maxFeelsLike),
    lowFeelsLike: Math.round(minFeelsLike),
    windSpeed: Math.round(windSpeed),
    precip: Math.round(precip * 100) / 100,
    iconCode,
  }
}

/**
 * Parse the daily weather data
 * @param daily Daily weather data
 * @returns Parsed daily weather data
 */

type ParseDailyWeather = {
  daily: {
    time: number[]
    weather_code: number[]
    temperature_2m_max: number[]
  }
}

/**
 * Parse the daily weather data
 * @param daily Daily weather data
 * @returns Parsed daily weather data
 */

function parseDailyWeather({ daily }: ParseDailyWeather) {
  return daily.time.map((time, index) => {
    return {
      timestamp: time * 1000,
      iconCode: daily.weather_code[index],
      maxTemp: Math.round(daily.temperature_2m_max[index]),
    }
  })
}

/**
 * Parse the hourly weather data
 * @param hourly Hourly weather data
 * @returns Parsed hourly weather data
 */

type ParseHourlyWeather = {
  hourly: {
    time: number[]
    weather_code: number[]
    temperature_2m: number[]
    apparent_temperature: number[]
    wind_speed_10m: number[]
    precipitation: number[]
  }
  current: {
    time: number
  }
}

/**
 * Parse the hourly weather data
 * @param hourly Hourly weather data
 * @param current_weather Current weather data
 * @returns Parsed hourly weather data
 */

function parseHourlyWeather({ hourly, current }: ParseHourlyWeather) {
  return hourly.time
    .map((time, index) => {
      return {
        timestamp: time * 1000,
        iconCode: hourly.weather_code[index],
        temp: Math.round(hourly.temperature_2m[index]),
        feelsLike: Math.round(hourly.apparent_temperature[index]),
        windSpeed: Math.round(hourly.wind_speed_10m[index]),
        precip: Math.round(hourly.precipitation[index] * 100) / 100,
      }
    })
    .filter(({ timestamp }) => timestamp >= current.time * 1000)
}
