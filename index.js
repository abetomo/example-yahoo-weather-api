const request = require('request')

const apiUrl = 'https://map.yahooapis.jp/weather/V1/place'
const formParams = {
  coordinates: [
    process.env.longitude,
    process.env.latitude
  ].join(','),
  appid: process.env.appid,
  output: 'json'
}

const getWeatherList = () => {
  return new Promise((resolve, reject) => {
    request({url: apiUrl, qs: formParams}, (error, response, body) => {
      if (error != null) {
        console.log(error)
        reject(response)
      }
      const data = JSON.parse(body)
      const weatherList = data.Feature[0].Property.WeatherList.Weather
      if (weatherList == null || weatherList.length === 0) {
        console.error(body)
        reject(response)
      }
      resolve(weatherList)
    })
  })
}

const getWeatherMessage = async () => {
  const weatherList = await getWeatherList()
  const observationRainfallTotal = (() => {
    return weatherList
      .filter(w => w.Type === 'observation')
      .map(w => w.Rainfall)
      .reduce((a, b) => a + b)
  })()

  const forecastList = weatherList.filter(w => w.Type === 'forecast')

  // 雨が降っていない時
  if (observationRainfallTotal === 0) {
    for (const weather of forecastList) {
      if (weather.Rainfall === 0) continue
      const m = weather.Date.match(/(\d{2})(\d{2})$/)
      return [
        '今は晴れてます。',
        `${parseInt(m[1])}時${parseInt(m[2])}分ころから雨が降りそうです。`
      ].join('\n')
    }
    return '今は晴れてます'
  }

  // 雨が降っている時
  for (const weather of forecastList) {
    if (weather.Rainfall !== 0) continue
    const m = weather.Date.match(/(\d{2})(\d{2})$/)
    return [
      '今は雨が降っています。',
      `${parseInt(m[1])}時${parseInt(m[2])}分ころから晴れそうです。`
    ].join('\n')
  }
  return '今は雨が降っています'
}

getWeatherMessage().then((message) => {
  console.log(message)
})
