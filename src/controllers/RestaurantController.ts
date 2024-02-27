import { Request, Response } from "express";
import Restaurant from "../models/restaurant";

const searchRestaurants = async (req: Request, res: Response) => {
  try {
    const city = req.params.city;

    // get the search query from query parameter and set the value to string
    const searchQuery = (req.query.searchQuery as string) || "";
    const selectedCuisines = (req.query.selectedCuisines as string) || "";
    const sortOption = (req.query.sortOption as string) || "lastUpdated";
    const page = parseInt(req.query.page as string) || 1;

    let query: any = {};
    // make the city case insensitive. Ex: london = London
    query["city"] = new RegExp(city, "i");

    // Number of restaurant of the given city
    const cityCheck = await Restaurant.countDocuments(query);

    // check if there are any restaurant of the given city, then we want to return early and skip the rest of the logic
    if (cityCheck === 0) {
      return res.status(404).json({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 1,
        },
      });
    }

    if (selectedCuisines) {
      // For example the URL is selectedCuisines=italian,burger,cheese
      // Then after splitting would be [italian, burger, cheese]
      // This line map((cuisine) => new RegExp(cuisine, "i")) will make individul element to look like this [/burger/i, /cheese/i, /italian/i]
      const cuisinesArray = selectedCuisines
        .split(",")
        .map((cuisine) => new RegExp(cuisine, "i"));

      query["cuisines"] = { $all: cuisinesArray };
    }

    if (searchQuery) {
      // for example ff we have restaurantName called Pizza palace in database and the cuisines sells are [pizza, pasta, italian]
      // If the search term in searchQuery is Pasta, then the query is going to run and check the restaurantName. Is the restaurantName have pasta in it? if not then we will continue to the cuisines array. If inside the cuisines array contain search term of searchQuery (in this case is pasta). Then we will return the Pizza palace restaurant
      const searchRegex = new RegExp(searchQuery, "i");
      query["$or"] = [
        { restaurantName: searchRegex },
        { cuisines: { $in: [searchRegex] } },
      ];
    }

    // The number of result of each page
    const pageSize = 10;

    // For example we hvae 12 result from the query. Since we only designed 10 result per page, then in this case there would be 2 page (10 on 1st page, and 2 on 2nd page). Then when the user click on 2nd page, the system will skip the 10 result on the first page. So it will shows the user the 2 results on the 2nd page
    const skip = (page - 1) * pageSize;

    // if the sortOption="lastUpdated", then it will sort the restaurant based on the lastUpdated
    const restaurants = await Restaurant.find(query)
      .sort({ [sortOption]: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(); // lean helps to strip out all the mongoose id and metadata and return the plain old JS object

    const totalResultOfQuery = await Restaurant.countDocuments(query);

    const response = {
      data: restaurants,
      pagination: {
        total: totalResultOfQuery,
        page,
        pages: Math.ceil(totalResultOfQuery / pageSize), // calculate how many pages. For example 50 results, pageSize is 10 per page. Then there would be 5 pages
      },
    };

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export default {
  searchRestaurants,
};
