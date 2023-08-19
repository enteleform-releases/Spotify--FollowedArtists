//###  NPM  ###//
import {Buffer } from "buffer"
import {orderBy} from "natural-orderby"


//####################################################################################################################//
//##>  Settings                                                                                                     ##//
//####################################################################################################################//

	const rootURL = document.location.origin


//####################################################################################################################//
//##>  Setup                                                                                                        ##//
//####################################################################################################################//

	const params = new URLSearchParams(document.location.search)
	const code   = params.get("code")


//####################################################################################################################//
//##>  Exports                                                                                                      ##//
//####################################################################################################################//

	export async function Main(){
		const $Page: $Page = {
			Download: document.getElementById("Download"),
			Info:     document.getElementById("Info"    ),
			Retry:    document.getElementById("Retry"   ),
			Spinner:  document.getElementById("Spinner" ),
		}

		const SpotifyData = await fetch("./get_Spotify_Credentials")
		const Spotify     = (await SpotifyData.json() as Spotify)
		console.log({Spotify})

		if(code)
			{await flow_App({$Page, Spotify, code})}
		else
			{flow_Login({$Page, Spotify})}
	}


//####################################################################################################################//
//##>  Types                                                                                                        ##//
//####################################################################################################################//

	type $Page = {
		Download: HTMLButtonElement
		Info:     HTMLDivElement
		Retry:    HTMLButtonElement
		Spinner:  HTMLDivElement
	}

	type Spotify = {
		ClientID:     string
		ClientSecret: string
	}


//####################################################################################################################//
//##>  Utilities                                                                                                    ##//
//####################################################################################################################//

	function flow_Login(
		{$Page,       Spotify        }:
		{$Page:$Page, Spotify:Spotify}
	){
		const scopes = "user-follow-read"; // Add any additional scopes required

		const params = new URLSearchParams()
		params.append("response_type", "code"          )
		params.append("client_id",     Spotify.ClientID)
		params.append("scope",         scopes          )
		params.append("redirect_uri",  rootURL         )

		const authorizeUrl = `https://accounts.spotify.com/authorize?${params}`
		window.location.replace(authorizeUrl)
	}

	async function flow_App(
		{$Page,       Spotify,         code       }:
		{$Page:$Page, Spotify:Spotify, code:string}
	){
		try{
			const params = new URLSearchParams()
			params.append("grant_type",   "authorization_code")
			params.append("code",         code                )
			params.append("redirect_uri", rootURL             )

			const auth =
				Buffer
				.from(`${Spotify.ClientID}:${Spotify.ClientSecret}`)
				.toString("base64")

			// Exchange the authorization code for an access token
			const response = await fetch("https://accounts.spotify.com/api/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${auth}`,
				},
				body: params.toString(),
			});

			const data: any = await response.json();

			if (!response.ok) {
				throw new Error(`Error retrieving access token: ${data.error.message}`);
			}

			const accessToken = data.access_token;

			// Use the access token to make API requests
			const artists = await getFollowedArtists(accessToken);

			// Display the followed artists
			const artistCount   = artists.length
			const sortedArtists = orderBy(artists)
			const fileText      = sortedArtists.join("\n")

			$Page.Info.innerText =
				(artistCount === 1)
				? `${artistCount} followed artist found.`
				: `${artistCount} followed artists found.`

			$Page.Spinner.remove()

			set_Download_Action({$Page, fileText, artistCount})
			$Page.Download.classList.remove("Hidden")
		}
		catch(error){
			$Page.Info.innerText = [
				"Error encountered.",
				"See console for more details.",
			].join("\n")

			$Page.Spinner .remove()
			$Page.Download.remove()

			set_Retry_Action({$Page})
			$Page.Retry.classList.remove("Hidden")

			throw error
		}
	}

	async function getFollowedArtists(accessToken:any) {
		const artists = [];
		let nextPage = "https://api.spotify.com/v1/me/following?type=artist&limit=50";

		while (nextPage) {
			const response = await fetch(nextPage, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});
			const data: any = await response.json();

			if (!response.ok) {
				throw new Error(`Error retrieving followed artists: ${data.error.message}`);
			}

			for (const artist of data.artists.items) {
				artists.push(artist.name);
			}

			nextPage = data.artists.next;
		}

		return artists;
	}

	function set_Download_Action(
		{$Page,       fileText,        artistCount       }:
		{$Page:$Page, fileText:string, artistCount:number}
	){
		$Page.Download.addEventListener("click", () => {
			const blob = new Blob([fileText], {type:"text/plain"})
			const url  = URL.createObjectURL(blob)

			const $Anchor    = document.createElement("a")
			$Anchor.download = "Spotify - Followed Artists.md"
			$Anchor.href     = url
			$Anchor.click()

			URL.revokeObjectURL(url)
			$Anchor.remove()
		})
	}

	function set_Retry_Action(
		{$Page      }:
		{$Page:$Page}
	){
		$Page.Retry.addEventListener("click", () => {
			window.location.replace(rootURL)
		})
	}
