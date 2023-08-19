//###  NPM  ###//
import {defineConfig} from "astro/config"
import Netlify        from "@astrojs/netlify/functions"
import Solid          from "@astrojs/solid-js"



//####################################################################################################################//
//##>  Exports                                                                                                      ##//
//####################################################################################################################//

	export default defineConfig({

		output:  "server",
		adapter: Netlify(),

		server: {
			port: 3000,
		},

		integrations: [
			Solid(),
		],

		vite: {
			server: {
				strictPort: true,
			},
		},

	})
