import "./style.css"
import { getWeather } from "./weather"
import { ICON_MAP } from "./iconMap"

/**
 * Get the current position of the user
 * @param positionSuccess Callback for successful geolocation
 * @param positionError Callback for failed geolocation
 * @param options Options for the geolocation API
 */

function getCurrentPosition(
  positionSuccess: (position: PositionSuccess) => void,
  positionError: (error: PositionError) => void,
  options: PositionOptions
): void {
  navigator.geolocation.getCurrentPosition(positionSuccess, positionError, options)
}

getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true })

/**
 * Handle successful geolocation
 * @param position Position object
 * @returns void
 */

type PositionSuccess = GeolocationPosition

/**
 * Handle successful geolocation
 * @param position Position object
 * @returns void
 */
async function positionSuccess({ coords }: PositionSuccess) {
  const weather = await getWeather(
    coords.latitude,
    coords.longitude,
    Intl.DateTimeFormat("fi-FI").resolvedOptions().timeZone
  )
  renderWeather(weather)

  const refreshButton = document.querySelector("[data-refresh]") as HTMLButtonElement
  refreshButton.addEventListener("click", async () => {
    document.body.classList.add("loading")
    const weather = await getWeather(
      coords.latitude,
      coords.longitude,
      Intl.DateTimeFormat("fi-FI").resolvedOptions().timeZone
    )
    renderWeather(weather)
  })
}

/**
 * Handle failed geolocation
 * @param error Error object
 * @returns void
 */
type PositionError = GeolocationPositionError

/**
 * Handle errors from the geolocation API
 * @param error Error object
 * @returns void
 */
function positionError(error: PositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    alert(error.message)
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    alert(error.message)
  } else if (error.code === error.TIMEOUT) {
    alert(error.message)
  } else {
    alert("An unknown error occurred.")
  }
}

/**
 * Rendered weather data
 */
type RenderWeather = {
  current: {
    currentTemp: number
    highTemp: number
    lowTemp: number
    highFeelsLike: number
    lowFeelsLike: number
    windSpeed: number
    precip: number
    iconCode: number
  }
  daily: {
    maxTemp: number
    timestamp: number
    iconCode: number
  }[]
  hourly: {
    temp: number
    feelsLike: number
    windSpeed: number
    precip: number
    timestamp: number
    iconCode: number
  }[]
}

/**
 * Render the weather data to the DOM
 * @param current Current weather data
 * @param daily Daily weather data
 * @param hourly Hourly weather data
 * @returns void
 */

function renderWeather({ current, daily, hourly }: RenderWeather) {
  renderCurrentWeather(current)
  renderDailyWeather(daily)
  renderHourlyWeather(hourly)
  document.body.classList.remove("loading")
}

/**
 * Set the value of an element based on the selector
 * @param selector Data attribute selector
 * @param value Value to set
 * @param parent Parent element to search in
 * @returns The element with the data attribute
 */
function setValue(selector: string, value: string | number, { parent = document }: {
  parent?: Document | DocumentFragment
} = {}) {
  const element = parent.querySelector(`[data-${selector}]`) as HTMLSpanElement
  if (element && typeof value === "number") {
    element.textContent = value.toString()
  } else if (element && typeof value === "string") {
    element.textContent = value
  }
}

/**
 * Get the URL to the icon based on the icon code
 * @param iconCode Icon code from the weather API
 * @returns URL to the icon
 */
function getIconUrl(iconCode: number) {
  return `icons/${ICON_MAP.get(iconCode)}.svg`
}

const currentIcon = document.querySelector("[data-current-icon]") as HTMLImageElement
function renderCurrentWeather(current: RenderWeather["current"]) {
  currentIcon.src = getIconUrl(current.iconCode)
  setValue("current-temp", current.currentTemp)
  setValue("current-high", current.highTemp)
  setValue("current-low", current.lowTemp)
  setValue("current-fl-high", current.highFeelsLike)
  setValue("current-fl-low", current.lowFeelsLike)
  setValue("current-wind", current.windSpeed)
  setValue("current-precip", current.precip)
}

const DAY_FORMATTER = new Intl.DateTimeFormat("fi-FI", { weekday: "long" })
const dailySection = document.querySelector("[data-day-section]") as HTMLDivElement
const dayCardTemplate = document.getElementById("day-card-template") as HTMLTemplateElement
function renderDailyWeather(daily: RenderWeather["daily"]) {
  dailySection.innerHTML = ""
  daily.forEach(day => {
    const element: DocumentFragment = dayCardTemplate.content.cloneNode(true) as DocumentFragment
    setValue("temp", day.maxTemp, { parent: element })
    setValue("date", DAY_FORMATTER.format(day.timestamp), { parent: element })
    if (element) {
      (element.querySelector("[data-icon]") as HTMLImageElement).src = getIconUrl(day.iconCode)
      dailySection.append(element)
    }
  })
}

const HOUR_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: "numeric" })
const hourlySection = document.querySelector("[data-hour-section]") as HTMLTableElement
const hourRowTemplate = document.getElementById("hour-row-template") as HTMLTemplateElement
function renderHourlyWeather(hourly: RenderWeather["hourly"]) {
  hourlySection.innerHTML = ""
  hourly.forEach(hour => {
    const element: DocumentFragment = hourRowTemplate.content.cloneNode(true) as DocumentFragment
    const formattedTime = HOUR_FORMATTER.format(hour.timestamp);
    if (element) {
      setValue("temp", hour.temp, { parent: element })
      setValue("fl-temp", hour.feelsLike, { parent: element })
      setValue("wind", hour.windSpeed, { parent: element })
      setValue("precip", hour.precip, { parent: element })
      setValue("day", DAY_FORMATTER.format(hour.timestamp), { parent: element })
      setValue("time", formattedTime, { parent: element });
      (element.querySelector("[data-icon]") as HTMLImageElement).src = getIconUrl(hour.iconCode)
      hourlySection.append(element)
    }
  })
}
