//###  NPM  ###//
import {Handler} from "@netlify/functions"


//####################################################################################################################//
//##>  Exports                                                                                                      ##//
//####################################################################################################################//

	export const handler: Handler = async (event, context) => ({
		statusCode: 200,
		body: JSON.stringify({
			ClientID:     process.env["Spotify__Client_ID"    ],
			ClientSecret: process.env["Spotify__Client_Secret"],
		}),
	})
