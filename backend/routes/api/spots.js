const express = require('express');
const { json } = require('sequelize');
const Sequelize = require('sequelize');
const op = Sequelize.Op;
const { restoreUser, requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { Spot, SpotImage, Review, User, Booking, ReviewImage } = require('../../db/models');

const router = express.Router();
const { handleValidationErrors } = require('../../utils/validation');

const validateReview = [
  check('review')
  .isString()
  .withMessage("Review text is required"),
  check('stars')
  .isInt({ min: 1, max: 5 })
  .withMessage("Stars must be an integer from 1 to 5"),
  handleValidationErrors
]

const validateSpot = []
const validateQueryParams = []



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/', async (req, res, next) => {
  let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

  //console.log(page)

 let errors = {}

  if (page && (isNaN(page) || page < 1)) errors.page = "Page must be greater than or equal to 1"
  if (size && ((isNaN(size)) || (size < 1))) errors.size = "Size must be greater than or equal to 1"
  if (maxLat && ((isNaN(maxLat)) || ((maxLat > 90) || (maxLat < -90)))) errors.maxLat = "Maximum latitude is invalid"
  if (minLat && ((isNaN(minLat)) || ((minLat < -90) || (minLat > 90)))) errors.minLat = "Minimum latitude is invalid"
  if (maxLng && ((isNaN(maxLng)) || ((maxLng > 180) || (maxLng < -180)))) errors.maxLng = "Maximum longitude is invalid"
  if (minLng && ((isNaN(minLng)) || ((minLng < -180) || (minLng > 180)))) errors.minLng = "Minimum longitude is invalid"
  if (minPrice && ((isNaN(minPrice)) || (minPrice < 0))) errors.minPrice = "Minimum price must be greater than or equal to 0"
  if (maxPrice && ((isNaN(maxPrice)) || (maxPrice < 0))) errors.maxPrice = "Maximum price must be greater than or equal to 0"

  const errSize = Object.keys(errors).length
  //console.log(errSize)

    if (errSize){
      const err = new Error('Put Failed');
      err.status = 400;
      err.message = 'Validation error';
      return res.json({
        message: err.message,
        statusCode: 400,
        errors
      })
    }

  page = parseInt(page);
  size = parseInt(size);
  minLat = parseInt(minLat);
  maxLat = parseInt(maxLat);
  minLng = parseInt(minLng);
  maxLng = parseInt(maxLng);
  minPrice = parseInt(minPrice);
  maxPrice = parseInt(maxPrice);

  if (Number.isNaN(page) || page <= 0) page = 1;
  if (Number.isNaN(size) || size <= 0) size = 20;
  if (Number.isNaN(minLat) || minLat < -90) minLat = -90
  if (Number.isNaN(maxLat) || maxLat > 90) maxLat = 90
  if (Number.isNaN(minLng) || minLng < -180) minLng = -180
  if (Number.isNaN(maxLng) || maxLng > 180) maxLng = 180
  if (Number.isNaN(minPrice) || minPrice < 0) minPrice = 0
  if (Number.isNaN(maxPrice)) maxPrice = 10000000

  const spots = await Spot.findAll({
    where: {
      lat: {
        [op.between]: [minLat, maxLat]
      },
      lng: {
        [op.between]: [minLng, maxLng]
      },
      price: {
        [op.between]: [minPrice, maxPrice]
      }
    },
    limit: size,
    offset: size * (page - 1)
  })
  let updatedSpots = []
  for (let i = 0; i < spots.length; i++){
    let spot = spots[i].toJSON();
    //console.log(spot)
    const avgRating = await Review.findAll({
      raw: true,
      where: {spotId: spot.id},
      attributes: [[Sequelize.fn('AVG', Sequelize.col('stars')), 'avgRating']]
    })

    const previewImage = await SpotImage.findAll({
      raw: true,
      where: { preview: true, spotId: spot.id},
      attributes: ['url']
    })
    if (avgRating){
      spot.avgRating = avgRating[0].avgRating
    }
    // console.log(previewImage[0].url)
    if(previewImage.length){
      spot.previewImage = previewImage[0].url
    }

    if(!previewImage.length){
      spot.previewImage = null
    }

    updatedSpots.push(spot)

  }

  //console.log(page, size)
  return res.json({'Spots': updatedSpots, 'page': page, 'size': size})
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/', requireAuth, async (req, res) => {
  const { user } = req;
  const id = user.id
  const { address, city, state, country, lat, lng, name, description, price} = req.body

  let errors = {}

  if (!address || !(typeof address === 'string')) errors.address = "Street address is required."
  if (!city || !(typeof city === 'string')) errors.city = "City is required."
  if (!state || !(typeof state === 'string')) errors.state = "State is required."
  if (!country || !(typeof country === 'string')) errors.country = "Country is required."
  if (!lat || (Number.isNaN(lat)) || (lat > 90 || lat < -90)) errors.lat = "Latitude is not valid"
  if (!lng || (Number.isNaN(lng)) || (lng > 180 || lat < -180)) errors.lat = "Longitude is not valid"
  if (!name || !(typeof name === 'string') || (name.length > 50)) errors.name = "Name must be less than 50 characters"
  if (!description || !(typeof description === 'string')) errors.description = "Description is required."
  if (!price || (Number.isNaN(price))) errors.lat = "Price per day is required"




  const errSize = Object.keys(errors).length

    if (errSize){
      const err = new Error('Put Failed');
      err.status = 400;
      err.message = 'Validation error';
      return res.json({
        message: err.message,
        statusCode: 400,
        errors
      })
    }

  let spot = await Spot.create({
    ownerId: id,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price
  })
  res.statusCode = 201
  res.json(spot)
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/current', restoreUser, async (req, res) => {
  const { user } = req;
  const id = user.id

  const userSpots = await Spot.findAll({
    where: {
      ownerId: id
    }
  })

  let updatedSpots = []
  for (let i = 0; i < userSpots.length; i++){
    let spot = userSpots[i].toJSON();
    //console.log(spot)
    const avgRating = await Review.findAll({
      raw: true,
      where: {spotId: spot.id},
      attributes: [[Sequelize.fn('AVG', Sequelize.col('stars')), 'avgRating']]
    })

    const previewImage = await SpotImage.findAll({
      raw: true,
      where: { preview: true, spotId: spot.id},
      attributes: ['url']
    })
    if (avgRating){
      spot.avgRating = avgRating[0].avgRating
    }
    // console.log(previewImage[0].url)
    if(previewImage.length){
      spot.previewImage = previewImage[0].url
    }

    if(!previewImage.length){
      spot.previewImage = null
    }

    updatedSpots.push(spot)

  }
  res.json({'Spots': updatedSpots})
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/:spotId/reviews', requireAuth, async (req, res) => {
  const { review, stars } = req.body

  let errors = {}

  if (!review || !(typeof review === 'string')) errors.review = "Review text is required"
  if (!stars || (Number.isNaN(stars)) ||(stars > 5 || stars < 1)) errors.stars = "Stars must be an integer from 1 to 5"

  const errSize = Object.keys(errors).length

    if (errSize){
      const err = new Error('Post Failed');
      err.status = 400;
      err.message = 'Validation error';
      return res.json({
        message: err.message,
        statusCode: 400,
        errors
      })
    }


  const { user } = req;
  const id = user.id
  const spot = await Spot.findByPk(req.params.spotId)
  if (!spot){
    const err = new Error('Search failed');
    err.message = "Spot couldn't be found.";
    res.statusCode = '404';
    return res.json({
      message: err.message,
      statusCode: 404
    })
  }

  const reviews = await Review.findOne({
    where: {
      spotId: spot.id,
      userId: id
    }
  })

  if (reviews){
    const err = new Error('Review already exists');
    err.message = "User already has a review for this spot.";
    res.statusCode = '403';
    return res.json({
      message: err.message,
      statusCode: 403
    })
  }

  const newReview = await Review.create({
    userId: id,
    spotId: spot.id,
    review,
    stars
  })
  res.statusCode = 201
  res.json(newReview)
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/:spotId/reviews', async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId)
  if (!spot){
    const err = new Error('Search failed');
    err.message = "Spot couldn't be found.";
    res.statusCode = '404';
    return res.json({
      message: err.message,
      statusCode: 404
    })
  }

  let allReviews = []

  const reviews = await Review.findAll({
    where: {
      spotId: spot.id
    }
  })

  for(let i = 0; i < reviews.length; i++){

    //console.log('made it 1')
    let review = reviews[i].toJSON()
    const reviewUser = await User.findByPk(reviews[i].userId, {
      attributes: ['id', 'firstName', 'lastName']
    })

    review.User = reviewUser

    const reviewImages = await ReviewImage.findAll({
      where: {
        reviewId: review.id
      },
      attributes: ['id', 'url']
    })

    let reviewImagesArr = []
    for(let i = 0; i < reviewImages.length; i++){
      let reviewImage = reviewImages[i].toJSON()
      reviewImagesArr.push(reviewImage)
    }
    review.ReviewImages = reviewImagesArr
    allReviews.push(review)
  }

  res.json({'Reviews': allReviews})
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/:spotId/images', requireAuth, async (req, res) => {
  const { user } = req;
  const id = user.id

  const {url, preview} = req.body

  let spot = await Spot.findByPk(req.params.spotId)
  if (!spot){
    const err = new Error('Search failed');
    err.message = "Spot couldn't be found.";
    res.statusCode = '404';
    return res.json({
      message: err.message,
      statusCode: 404
    })
  }

  if (spot.ownerId !== id) {
    const err = new Error('Failed')
    err.message = "Forbidden"
    res.statsCode = '403'
    return res.json({
      message: err.message,
      statusCode: 404
    })
  }

  const img = await SpotImage.create({
    spotId: spot.id,
    url,
    preview
  })

  const returnImg = await SpotImage.findByPk(img.id, {
    attributes: ['id', 'url', 'preview']
  })
  return res.json(returnImg)

})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
  const { user } = req;
  const id = user.id

  const spot = await Spot.findByPk(req.params.spotId)

  const {startDate, endDate} = req.body

  if (!spot){
    const err = new Error('Search failed');
    err.message = "Spot couldn't be found.";
    res.statusCode = '404';
    return res.json({
      message: err.message,
      statusCode: 404
    })
  }

  if (spot.ownerId === id){
    const err = new Error('Denied');
    err.message = "You cannot make a booking for a spot you own.";
    res.statusCode = '403';
    return res.json({
      message: err.message,
      statusCode: 403
    })
  }

  const newStart = new Date(startDate)
  const newEnd = new Date(endDate)
  const conflictingDate = await Booking.findAll({
    where: {
      spotId: spot.id,
      startDate: {
      [op.between]: [newStart, newEnd]
      },
      endDate: {
        [op.between]: [newStart, newEnd]
      }
    }
  })

  //console.log(conflictingDate)

  if(conflictingDate.length){
    const err = new Error('Conflicting dates');
    err.message = "Sorry, this spot is already booked for the specified dates.",
    res.statusCode = '403'
    return res.json({
      message: err.message,
      statusCode: 403
    })

  }

  const newBooking = await Booking.create({
    spotId: spot.id,
    userId: id,
    startDate,
    endDate
  })
  res.json(newBooking)
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { user } = req;
  const id = user.id
  let allBookings = []
  const spot = await Spot.findByPk(req.params.spotId, {
    attributes: ['ownerId']
  })

  if (!spot){
    const err = new Error('Search failed');
    err.message = "Spot couldn't be found.";
    res.statusCode = '404';
    return res.json({
      message: err.message,
      statusCode: 404
    })
  }

  // if (spot.ownerId !== id){
  //   let booking = await Booking.findAll({
  //     where: {
  //       spotId: req.params.spotId
  //     },
  //     attributes: ['spotId', 'startDate', 'endDate']
  //   })

  //   for(let i = 0; i < booking.length; i++) {
  //     let currentBooking = booking[i].toJSON()
  //     allBookings.push(currentBooking)
  //   }
  // }

  if (spot.ownerId === id){           //spent 30 minutes trying to fix this. wasn't broken at all.
    //console.log('owner')
    let booking = await Booking.findAll({
      where: {
        spotId: req.params.spotId
      }
    })
    //console.log(booking)
    for(let i = 0; i < booking.length; i++) {
      let currentBooking = booking[i].toJSON()
      let user = await User.findByPk(currentBooking.userId, {
        raw: true,
        attributes: ['id', 'firstName', 'lastName']
      })



      currentBooking.User = user
      allBookings.push(currentBooking)
    }

  }

  res.json({"Bookings": allBookings})
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.put('/:spotId', requireAuth, async (req, res) =>{
  const { user } = req;
  const id = user.id
  let { address, city, state, country, lat, lng, name, description, price} = req.body

  let errors = {}
  let spot = await Spot.findByPk(req.params.spotId)
  if (!spot){
    const err = new Error('Search failed');
    err.message = "Spot couldn't be found.";
    res.statusCode = '404';
    return res.json({
      message: err.message,
      statusCode: 404
    })
}
  if (!address || (address === '')) address = spot.address
  if (!state || (state === '')) state = spot.state
  if (!city || (city === '')) city = spot.city
  if (!country || (country === '')) country = spot.country
  if (!price || (price === '')) price = spot.price
  if (!description || (description === '')) description = spot.description
  if (!name || (name === '')) name = spot.name
  //if (address && !(typeof address === 'string')) errors.address = "Street address is required."
  // if (!city || !(typeof city === 'string')) errors.city = "City is required."
  // if (!state || !(typeof state === 'string')) errors.state = "State is required."
  // if (!country || !(typeof country === 'string')) errors.country = "Country is required."
  // if (!lat || (Number.isNaN(lat)) || (lat > 90 || lat < -90)) errors.lat = "Latitude is not valid"
  // if (!lng || (Number.isNaN(lng)) || (lng > 180 || lat < -180)) errors.lat = "Longitude is not valid"
  // if (!name || !(typeof name === 'string') || (name.length > 50)) errors.name = "Name must be less than 50 characters"
  // if (!description || !(typeof description === 'string')) errors.description = "Description is required."
  // if (!price || (Number.isNaN(price))) errors.lat = "Price per day is required"




  const errSize = Object.keys(errors).length

    if (errSize){
      const err = new Error('Put Failed');
      err.status = 400;
      err.message = 'Validation error';
      return res.json({
        message: err.message,
        statusCode: 400,
        errors
      })
    }

  if (spot.ownerId !== id){
    //console.log(spot.ownerId, id)
    const err = new Error('Search failed');
    err.message = "Forbidden";
    res.statusCode = '403';
    return res.json({
      message: err.message,
      statusCode: 403
    })
  }
  //console.log(spot)
  spot.update({
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price
  })

  await spot.validate()

  await spot.save
  res.json(spot)

})
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/:spotId', async (req, res) => { // <<<<<<< me while writing this route https://www.youtube.com/watch?v=wkR6zN1h2TI

let id = req.params.spotId
let spot = await Spot.findByPk(id)
//console.log('get')
if (!spot){
  const err = new Error('Search failed');
  err.message = "Spot couldn't be found.";
  res.statusCode = '404';
  return res.json({
    message: err.message,
    statusCode: 404
  })
}

let ownerId = await Spot.findByPk(id, {
  attributes: ['ownerId']
})


let images = await SpotImage.findAll({
  where: {
    spotId: id,
    preview: true
  },
  attributes: ['id', 'url', 'preview']
})


let jsonSpot = spot.toJSON()
let jsonImages = images[0]
//console.log(jsonImages)


const owner = await User.findAll({
  raw: true,
  where: {id: ownerId.ownerId},
  attributes: ['id', 'firstName', 'lastName']
})

// const owner1 = owner[0]
// console.log(owner1.toJSON())

const numReviews = await Review.findAll({
  raw: true,
  where: {spotId: req.params.spotId},
  attributes: [[Sequelize.fn('COUNT', Sequelize.col('stars')), 'numReviews']]
})
const avgStarRating = await Review.findAll({
  raw: true,
  where: {spotId: req.params.spotId},
  attributes: [[Sequelize.fn('AVG', Sequelize.col('stars')), 'avgRating']]
})

if (numReviews){
  jsonSpot.numReviews = numReviews[0].numReviews
}
if (avgStarRating){
  jsonSpot.avgStarRating = avgStarRating[0].avgRating
}
if (jsonImages){
  jsonSpot.SpotImages = images
}
if (!jsonImages){
  jsonSpot.SpotImages = null
}
if(owner){
  jsonSpot.Owner = owner[0]
}


res.json(jsonSpot)
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.delete('/:spotId', requireAuth, async (req, res) =>{
  const { user } = req;
  const id = user.id
  //console.log(id)

  const spotDelete = await Spot.findByPk(req.params.spotId)

  if (!spotDelete) {
    res.statusCode = 404
    res.json({
      message: "Spot couldn't be found",
      statusCode: res.statusCode
    })
  }

  if (spotDelete.ownerId !== id){
    const err = new Error('Search failed');
    err.message = "Forbidden";
    res.statusCode = '403';
    return res.json({
      message: err.message,
      statusCode: 403
    })
  }

  spotDelete.destroy()
    res.statusCode = 200
    res.json({
      message: "Successfully deleted",
      statusCode: res.statusCode
    })
})

module.exports = router;
