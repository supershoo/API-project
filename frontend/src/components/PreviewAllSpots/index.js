import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSpots, reset} from '../../store/spots';
import './SpotsPreview.css'



function PreviewAllSpots(){


  const dispatch = useDispatch();

  const spots = useSelector(state => state.spots)
  console.log(spots)

  useEffect(() => {
    dispatch(getSpots());
  }, [dispatch])


  return (
    <div className="body">
      <div className='spots'>
        {Object.values(spots).map((spot) => {
          return (
            <div key={spot.id} className="spot">
              <Link to={`/spots/${spot.id}`}>
              <img src={spot.previewImage}/>
              </Link>
              <div className="row">
              <h3 className='location'>{spot.city}, {spot.state}</h3>
              <span className="star">
                <i class="fa-solid fa-star"></i>
                {spot.avgRating ? <span className="avgRating">{Number(spot.avgRating).toFixed(1)}</span>
                :<span className="avgRating">0</span>}
              </span>
              </div>
              <span className='price'>${spot.price} <span id="night">night</span></span>
            </div>
          )
        })}
      </div>
    </div>
  );


}

export default PreviewAllSpots
