const express = require('express')
const dotenv = require('dotenv').config()
const app = express()

app.use(express.json())

app.get('/',(req,res) => {
    res.send('API RUNNING')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server RUnning ${PORT}`))