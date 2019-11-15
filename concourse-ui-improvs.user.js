// ==UserScript==
// @name        concourse ui improvements
// @namespace   halfpipe.io userscripts
// @match       https://concourse.halfpipe.io/*
// @grant       none
// @version     1.0
// @author      samzilverberg@gmail.com
// @description concourse has terrible ui, trying to improve it via some simple userscipt
// @run-at document-end
// ==/UserScript==


/*
	User script to customise the Concourse pipeline view:
  - adds version number to each job
	- adds link to view pipeline config
	Designed for Halfpipe pipelines using "update-pipeline" feature - see https://docs.halfpipe.io/auto-updating-pipelines/
*/



/**
 * concourse navigation is sometimes a whole page reload and sometimes via ajax and changing the window href.
 * the title always change. so we create a MutationObserver on it to detect page changes
 * https://stackoverflow.com/questions/2497200/how-to-listen-for-changes-to-the-title-element
 */

// saving href because want a clone of string instead of pointer to location object
var oldLocationHref = document.location.href;

window.onload = function() {
  // give our "main" a 1st run to add anything that needs tobe loaded on fresh page reload (non-ajax)
  // onLocationChange(document.location, oldLocationHref)

  new MutationObserver(function(mutations) {
    // console.log('observer mutator called', oldLocationHref, document.location.href)
    // console.log(mutations);
    
    if (oldLocationHref != document.location.href) {
      onLocationChange(document.location, oldLocationHref)
      oldLocationHref = document.location.href;
    }
  }).observe(
      document.querySelector('title'),
      { subtree: true, characterData: true, childList: true }
  );
};


function onLocationChange(newLocation, oldLocationHref){
  console.log('onLocationChange: ' + newLocation + ' --> ' + oldLocationHref)
  if (newLocation.pathname == "/"){
    console.log("on maindashboard page")
  } else if (newLocation.href.match(/\/teams\/.+\/pipelines\/.+\/jobs\/.+\/builds/g)) {
    console.log('in jobs build details page')
    // TODOS
    //  show exact times next to started and finished
    //  show git commit message  on right side of "started/finished" area
    
    var durationTableEl = document.querySelector('table.dictionary.build-duration')
    var durationsTrs = durationTableEl.querySelectorAll('tr')
    var startedEl = durationsTrs[0]
    var startedSpan = startedEl.querySelector('span')
    var finishedEl = durationsTrs[1]
    var finishedSpan = finishedEl.querySelector('span')
    
    console.log('----------')
    console.log(durationsTrs[0].querySelector('div'))
    
    var oldDiv = durationsTrs[0].querySelector('div')
    var adiv= document.createElement("div")
    var startedTextEl = document.createTextNode(startedSpan.innerText.length >  startedEl.childNodes[1].title.length ? startedSpan.innerText :  startedEl.childNodes[1].title)
    adiv.appendChild(startedTextEl)

  
    if (oldDiv) {
      //replace old
      oldDiv.parentNode.replaceChild(adiv, oldDiv)
    } else {
      //append initial elem
      startedEl.childNodes[1].appendChild(adiv)
    }
    startedEl.childNodes[1].querySelector('span').style.display = "none"
  
    // finishedEl.childNodes[1].appendChild(document.createTextNode(finishedEl.childNodes[1].innerText + ' ' + finishedEl.childNodes[1].title))
    // finishedEl.childNodes[1].querySelector('span').style.display = "none"
    
  } else if (newLocation.href.match(/\/teams\/.+\/pipelines\/.+\/jobs\/.+/g)) {
    console.log('in jobs builds list view')
  } else if (newLocation.href.match(/\/teams\/.+\/pipelines\//g)) {
    console.log("on pipelines page")
      // const intervalId = setInterval(() => {
      //     const svg = document.querySelector('svg.pipeline-graph');
      //     if (svg) {
      //         addConfigLink();
      //         const observer = new MutationObserver(annotatePlan);
      //         observer.observe(svg, {attributes: true, childList: false, subtree: false});
      //         clearInterval(intervalId);
      //     }
      // }, 50);
  } 
}


function annotatePlanRob() {
	let jobsUrl = window.location.href.replace('.io/', '.io/api/v1/') + '/jobs';
	fetch(jobsUrl).then(function (response) {
		return response.json();
	}).then(function (stages) {
		const stageElements = document.querySelectorAll('.node.job');

		stages.forEach((stage, i) => {
			var build = stage.next_build || stage.finished_build
			if (!build || stageElements[i].hasAnnotation) {
				return;
			}
			const resourcesUrl = `${window.location.origin}/${build.api_url}/resources`;
			return fetch(resourcesUrl)
				.then(x => x.json())
				.then(resources => {
					const versionInput = resources.inputs.filter(x => x.name === "version");
					if (versionInput.length === 0) {
						return;
					}

					const message = versionInput[0].version.number;
					stageElements[i].innerHTML += `<text x="2" y="8" style="font-size:80%">${message}</text>`;
					stageElements[i].hasAnnotation = true;
				});
		});
	});
}

function addConfigLink() {
	let configUrl = window.location.href.replace('.io/', '.io/api/v1/') + '/config';
	var cell = document.querySelector("table.lower-right-info").insertRow(-1).insertCell(0);
	cell.colSpan = 2;
	cell.innerHTML = `<a href="${configUrl}">pipeline config</a>`;
}






// copy paste from https://github.com/joeyciechanowicz/better-concourse/blob/master/src/inject/inject.js 

let lastRun = (new Date).getTime();

function getVersionRef(resources) {
	const gitResources = resources.filter(x => x.type === 'git')
		.map(x => x.version.ref);

	if (gitResources.length > 0) {
		return gitResources[0];
	}
	return undefined;
}

function getCommitsBetweenRefs(startRef, finishRef, gitCommits) {
	const commits = [];
	for (let i = 0; i < gitCommits.length && gitCommits[i].version.ref !== finishRef; i++) {
		commits.push(gitCommits[i]);
	}
	return commits;
}

function decorateJobSvgElement(element, gitCommits) {
  console.log('decorateJobSvgElement:' + element)
  
	let messages = gitCommits.map(commit => commit.metadata ? commit.metadata.filter(y => y.name === 'message')[0].value : commit.version.ref)
		// .map(x => x.length > 27 ? x.substr(0, 27) + '...' : x);

  console.log(messages)
	// const message = messages
	// 	.map((x, i) => `<text y="-${(i + 1) * 13}" width=200>${x}</text>`)
	// 	.join('');

	// element.innerHTML += message;
  element.innerHTML += `<text y="-20" x="0" font-size="6" width="200" height="100">${messages}</text>`;
  
}

function annotatePlan() {
  if ((new Date).getTime() - lastRun < 50) {
  	return;
	}
	lastRun = (new Date).getTime()

	let options = {
		'credentials': 'include',
		'headers': {},
		'body': null,
		'method': 'GET',
		'mode': 'cors'
	};

	const jobsUrl = window.location.href.replace('/teams/', '/api/v1/teams/') + '/jobs';
	const gitVersionsUrl = window.location.href.replace('/teams/', '/api/v1/teams/') + '/resources/git/versions';


	Promise.all([jobsUrl, gitVersionsUrl].map(x => fetch(x, options).then(r => r.json())))
		.then(([jobs, gitVersions]) => {
			const jobElements = document.querySelectorAll('.node.job');

			console.log('Stuff', jobs, gitVersions, jobElements);

			Promise.all(jobs.map((job, i) => {
				const build = job.next_build || job.finished_build;

				if (!build) {
					return;
				}

				const resourcesUrl = `${window.location.origin}/${build.api_url}/resources`;
				const buildsUrl = `${window.location.origin}/api/v1/teams/${build.team_name}/pipelines/${build.pipeline_name}/jobs/${build.job_name}/builds`;

				return fetch(buildsUrl, options).then(x => x.json())
					.then(builds => {
						if (builds.length < 2) {
							return;
						}

						const previousBuildResourcesUrl = `${window.location.origin}/api/v1/builds/${builds[1].id}/resources`

						return Promise.all([resourcesUrl, previousBuildResourcesUrl].map(x => fetch(x, options).then(r => r.json())))
							.then(([resources, previousResources]) => {
								const currentRef = getVersionRef(resources.inputs);
								const previousRef = getVersionRef(previousResources.inputs);
								const commits = getCommitsBetweenRefs(currentRef, previousRef, gitVersions);


								return {
									i,
									commits,
									elem: jobElements[i],
									job
								};
							});
					});
			})).then(stageDetails => {
				stageDetails.sort((a, b) => a.i - b.i);

				const seenTop = stageDetails[0].elem.getBoundingClientRect().top;
				stageDetails.filter(x => x)
					.forEach(details => {
						decorateJobSvgElement(details.elem, details.commits);

					});
			});
		});
}

