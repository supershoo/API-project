import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"
import { getBookings } from "../../store/bookings"
import { useHistory, useParams } from "react-router-dom"


function SpotUserBooking(){

  const history = useHistory()
  const dispatch = useDispatch()
  const sessionUser = useSelector((state) => state.session.user)
  const bookings = useSelector((state) => state.bookings)
  let bookingsArr = Object.values(bookings)
  let realBookings = bookingsArr[0]
  console.log("SpotUserBooking:", bookingsArr)
  const { spotId } = useParams()

  useEffect(() => {
    dispatch(getBookings())
  }, [dispatch])



  return (
    <div>
      {Object.values(bookingsArr).map((booking) => {
        return (
          <div key = {booking.id} className="bookingsBody">
            <span className = "userBooking">You've booked this spot for {booking.startDate} to {booking.endDate}</span>
          </div>
        )
      })}
    </div>
  )
}

export default SpotUserBooking
