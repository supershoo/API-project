import {useEffect, useState} from "react";
import {useDispatch} from "react-redux"
import {useHistory, useParams} from "react-router-dom"
import { createBooking } from "../../store/bookings"


function CreateBooking(){

  const dispatch = useDispatch()
  const { spotId } = useParams()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [errors, setErrors] = useState([])
  let history = useHistory()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      startDate,
      endDate
    }
    let newBooking = await dispatch(createBooking(payload, spotId))
    await history.push(`/spots/${spotId}`)
  }

  return (
    <div>
      <form className = "createBookingForm" onSubmit = {handleSubmit}>
        <ul className = "errors">
        {errors.map((error, idx) => <li key={idx}>{error}</li>)}
        </ul>
        <div className = "inputDiv">
          <input id="inputBooking" placeholder = "startDate"
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className = "inputDiv">
          <input id="inputBooking" placeholder = "endDate"
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div>
          <button id="create" type="submit">Create Booking</button>
        </div>
      </form>
    </div>
  )
}

export default CreateBooking
