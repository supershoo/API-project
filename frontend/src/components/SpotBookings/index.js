import { useEffect } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import { useParams, useHistory } from 'react-router-dom'
import { getSpotBookings, getBookings, deleteBooking } from '../../store/bookings'

function SpotBookings(){

  let isOwner
  let hasBooking = false
  let bookingId
  let userBookings
  const history = useHistory()

  const { spotId } = useParams()
  const dispatch = useDispatch();
  const bookingsObj = useSelector(state => state.bookings)
  const sessionUser = useSelector((state) => state.session.user);
  const isLoggedIn = sessionUser
  const spot = useSelector(state => state.spots[spotId])


  let bookingsArr = Object.values(bookingsObj)
  let ownedBooking = bookingsArr.find(booking => booking.userId === sessionUser.id)
  // console.log("User's booking:", ownedBooking)
  console.log("All bookings", bookingsArr)
  let bookings = bookingsArr[0]
  // console.log("Booking: ", bookingsObj)
  if (ownedBooking) {
    bookingId = bookings.id
    hasBooking = true
    console.log(hasBooking)
  }

  if (sessionUser){
    isOwner = sessionUser.id === spot.ownerId
    // isOwnerBooking = sessionUser.id === booking.userId
  }

  const destroyBooking = async (e) => {
    e.preventDefault();
    await dispatch(deleteBooking(bookingId))
    await dispatch(getSpotBookings(spotId))
  }

  useEffect(() => {
    dispatch(getBookings(spotId))
  }, [dispatch])

  const reroute = async (e) => {
    e.preventDefault();
    await history.push(`/spots/${spotId}/book`)
  }





  return (
    <div className="body">
      {(isLoggedIn && ((!isOwner) && (!hasBooking))) ? <button id="CreateBookingButton" onClick={reroute}>Create Booking</button> : <></>}
      <div className='bookings'>
        {
         bookings ? (Object.values(bookings).map((booking) => {
          if (!booking) return null
          if (ownedBooking) hasBooking = true
            return (
              <div key={booking.id} className = "booking">
                {isOwner ? <h3 className='bookingOwner'>Booked by {booking.User.firstName} {booking.User.lastName}</h3> : <></>}
                {isOwner ? <h3 className='dates'>From {booking.startDate.slice(0, 10)} to {booking.endDate.slice(0, 10)}</h3> : <></>}
                {hasBooking ? <button id='DeleteBookingButton' onClick={destroyBooking}></button>: <></>}
              </div>
            )
         })
         ) : (
          <></>
         )
        }
      </div>
    </div>
  )
}

export default SpotBookings
