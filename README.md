# Gantt

This project is a gantt visualization for project scheduling, it uses d3.

You can reschedule your events by dragging them, it will also execute your custom function (it could be for example an HTTP call to update your event persistently.)

When zooming in and out, it will also call your custom function (for examplee an HTTP call toload more data within the new bounds)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Run the project locally

To run the project locally, please `npm i`. Once all the dependencies are installed,
run `npm start` to start the project locally [http://localhost:3000]
The originalintent of this project was to deploy it as a npm package in order for third parties to use it easily.
