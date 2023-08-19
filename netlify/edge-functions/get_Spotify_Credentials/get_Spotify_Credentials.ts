import type {Context} from "https://edge.netlify.com"

export default async (request:Request, context:Context) => {
  return Response.json({
		ClientID:     Netlify.env.get("Spotify__Client_ID"    ),
		ClientSecret: Netlify.env.get("Spotify__Client_Secret"),
	})
}
