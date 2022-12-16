import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { destroySpot, getOneSpot } from '../../store/spots';
import SpotReviews from '../SpotReviews/SpotReviews';
import SpotBookings from '../SpotBookings';
import SpotUserBooking from '../SpotUserBooking/SpotUserBooking';
import { hasReview } from '../SpotReviews/SpotReviews'
import './SpotDetails.css'

export let isOwner
function SpotDetails() {

  let isOwner
  const sessionUser = useSelector((state) => state.session.user);
  const dispatch = useDispatch();


  useEffect(() => {
    dispatch(getOneSpot(spotId));
  }, [dispatch])

  const history = useHistory()
  const { spotId } = useParams()
  const spot = useSelector(state => state.spots[spotId])
  if (!spot?.SpotImages) return null

  const deleteSpot = async (e) => {
    e.preventDefault();
    await dispatch(destroySpot(spotId))
    await history.push('/')
  }

  const reroute = async (e) => {
    e.preventDefault();
    await history.push(`/spots/${spotId}/create`)
  }

  const updateSpot = async (e) => {
    e.preventDefault();
    await history.push(`/edit/${spotId}`)
  }

  if (sessionUser)(
  isOwner = sessionUser.id === spot.ownerId
  )
  const isLoggedIn = sessionUser




  return (
    <div className="spotDetails">
      <h2 className = "SpotName">{spot.name}
       <i className="fa-solid fa-star"></i> {spot.avgStarRating ?
        <span className="avgRatingSpot">{Number(spot.avgStarRating).toFixed(1)}</span>
        :<span className="avgRatingSpot">0</span>}</h2>
      <div className="topinfo">
      <h3 className ="location">{spot.address}, {spot.city}, {spot.state}, {spot.country}</h3>
      <div className = "OwnerButtons">
      {isOwner ? <button id = "DeleteSpotButton" onClick={deleteSpot}>Delete listing</button> : <></> }
      {isOwner ? <button id = "UpdateSpotButton" onClick={updateSpot}>Update Information</button> : <></>}
      </div>
      </div>
      <img className= "SpotImage" src={spot.SpotImages[0].url} alt='image'/>
      <h3 className = "ownerName">Hosted by {spot.Owner.firstName}</h3>
      <h3 className = "SpotPrice">${spot.price} <span id="night">night</span></h3>
      <div className = "description">
      <p>{spot.description}</p>
      </div>
      <div>
      <SpotReviews/>
      </div>
      <div>
      {/* <SpotUserBooking/> */}
      </div>
      <div>
      <SpotBookings/>
      </div>
    </div>
  )
}

export default SpotDetails
