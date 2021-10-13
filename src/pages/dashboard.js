import React, { useEffect, useState, useContext } from 'react';
import Layout from '@theme/Layout';

import { AppProvider, appStore } from './../state/app';
import { getCall } from '../utils/api'
import { YOUR_APP_NAME, YOUR_API_KEY } from '../config'
import { TryItNowWithEnv } from '../../src/components/TryItNow'
import { get, set } from '../utils/storage'
import { whenFormatted } from '../utils/date'
import './dashboard.scss'

import { BarChart } from './../components/Chart'
import './../components/DialogActions'

function DashboardInner() {
	const { state: { app: { env, keys } } } = useContext(appStore)

	const [state, _setState] = useState({
		isApiKeyShown: false,
		appName: '',
		apiKey: '',
		types: {},
		claims: {},
	})
	const setState = (newState) => _setState((state) => ({ ...state, ...newState }))

	const init = async () => {
		const appName = get(YOUR_APP_NAME)
		const apiKey = get(YOUR_API_KEY)
		setState({ appName, apiKey })
		loadState({ appName, apiKey })
	}
	useEffect(init, [])

	const loadState = async ({ appName, apiKey }) => {
		setState({ types: await getCall({ env, appName, apiKey, path: 'types' }) })
		setState({ claims: await getCall({ env, appName, apiKey, path: 'claims' }) })
	}

	const updateAppDetails = () => {
		const { appName, apiKey } = state
		set(YOUR_APP_NAME, appName)
		set(YOUR_API_KEY, apiKey)
		loadState({ appName, apiKey })
	}

	const {
		isApiKeyShown, appName, apiKey,
		claims, types,
	} = state

	let claimsArr = Object.entries(claims)
	let typesArr = Object.entries(types)
	if (types.error || claims.error) {
		typesArr = []
		claimsArr = []
	}

	claimsArr.sort(([k1, a], [k2, b]) => {
		if (!a.ts) a.ts = parseInt(k1.split('/')[0], 10)
		if (!b.ts) b.ts = parseInt(k2.split('/')[0], 10)
		return b.ts - a.ts
	})

	/// TODO in API
	const data = [0, 0, 0]
	claimsArr.forEach(([k, { nft, ld }]) => {
		if (!nft && !ld) data[0]++;
		if (nft) data[1]++;
		if (ld) data[2]++;
	})

	return (
		<Layout title="Hello">
			<section>
				<h2>App Details</h2>

				<TryItNowWithEnv hasProvider={true} />

				<div className="table">
					<div className="row">
						<div className="cell">App Name</div>
						<div className="cell padding-0">
							<input value={appName} onChange={(e) => setState({ appName: e.target.value })} />
						</div>
					</div>
					<div className="row">
						<div className="cell">Api Key</div>
						<div className="cell padding-0">
							<input type={isApiKeyShown ? 'text' : 'password'} value={apiKey} onChange={(e) => setState({ apiKey: e.target.value })} />
						</div>
					</div>
				</div>
				<button className="custom-button table-of-contents__link" onClick={() => updateAppDetails()}>Update App Details</button>
				<button className="custom-button table-of-contents__link" onClick={() => setState({ isApiKeyShown: !isApiKeyShown })}>{isApiKeyShown ? 'Hide' : 'Show'} API Key</button>

				<h2>NFT Series</h2>
				<div className="table">
					{
						typesArr.map(([k, v], i) => <div key={i} className="row">
							<div className="cell">{k}</div>
							<div className="cell">
								{JSON.stringify(v)}
							</div>
						</div>)
					}
				</div>

				<h2>Summary</h2>
				<BarChart data={data} />

				<h2>Claim Links</h2>
				<div className="table">
					{
						claimsArr.slice(0, 100).map(([k, v], i) => {
							const { ts } = v
							return <div key={i} className="row">
								<div className="cell">
									Created: {whenFormatted(ts)}
								</div>
								<div className="cell">
									{JSON.stringify(v)}
								</div>
							</div>
						})
					}
				</div>

			</section>
		</Layout>
	);
}

const Dashboard = () => {
	return <AppProvider>
		<DashboardInner />
	</AppProvider>
};

export default Dashboard