import { ActionResponse, Protocol } from '../../src';

const protocols: Protocol[] = [
  {
    scheme: 'function',
    handler: (response: ActionResponse) => {
      if (response.actionId === 'get_weather') {
        return {
          current: {
            temperature: 15, // Celsius
            condition: 'Cloudy',
            humidity: 82,
            wind: {
              speed: 5, // km/h
              direction: 'NW',
            },
            feels_like: 13, // Celsius
            pressure: 1012, // hPa
          },
          forecast: {
            day_of_week: 'Monday',
            high: 18, // Celsius
            low: 11, // Celsius
            summary:
              'Partly cloudy with a chance of light rain in the afternoon.',
          },
        };
      }
    },
  },
];

export { protocols };
