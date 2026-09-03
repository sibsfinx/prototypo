import cloneDeep from 'lodash/cloneDeep';
import PropTypes from 'prop-types';
import React from 'react';
import TutorialContent from 'tutorial-content';
import InlineSVG from 'svg-inline-react';
import ReactMotionFlip from 'react-motion-flip';

import CourseCard from './academy-course-card.components';
import postitSvg from '../../../images/academy/postit.svg?raw';
import iphoneSvg from '../../../images/academy/iphone.svg?raw';
import redbookSvg from '../../../images/academy/redbook.svg?raw';
import macbookSvg from '../../../images/academy/macbook.svg?raw';
import penSvg from '../../../images/academy/pen.svg?raw';
import coffeeSvg from '../../../images/academy/coffee.svg?raw';
import rulerSvg from '../../../images/academy/ruler.svg?raw';
import bluebookSvg from '../../../images/academy/bluebook.svg?raw';
import paperSvg from '../../../images/academy/paper.svg?raw';
import loupeSvg from '../../../images/academy/loupe.svg?raw';
import blackpenSvg from '../../../images/academy/blackpen.svg?raw';
import medalHomeSvg from '../../../images/academy/medal-home.svg?raw';

class AcademyHome extends React.PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			tags: [],
			activeTag: 'all',
			courses: [],
		};

		this.tutorials = new TutorialContent();
		this.setActiveTag = this.setActiveTag.bind(this);
		this.areAllCourseRead = this.areAllCourseRead.bind(this);
	}

	componentWillMount() {
		const academyProgress = cloneDeep(this.props.academyProgress);
		const tags = [];
		const courses = this.state.courses;

		// Map through the course to :
		// Get title, header and slug
		// Get part count from progress or init the progress
		this.tutorials.content.forEach((tutorial) => {
			let parts = [];

			tutorial.tags.forEach((tag) => {
				if (!tags.includes(tag)) {
					tags.push(tag);
				}
			});
			if (academyProgress[tutorial.slug]) {
				parts = academyProgress[tutorial.slug].parts;
			}
			else {
				tutorial.content.split(/[^\#]#{2} +/g).forEach((value, index) => {
					if (index !== 0) {
						parts.push({
							name: value.split(/\r\n|\r|\n/g)[0],
							completed: false,
						});
					}
				});
			}
			const compare = function compare(a, b) {
				const dateA = new Date(a.date).getTime();
				const dateB = new Date(b.date).getTime();

				return dateA > dateB ? 1 : -1;
			};

			courses.push({
				title: tutorial.title,
				header: tutorial.header,
				slug: tutorial.slug,
				partCount: parts.length,
				readingTime: tutorial.readingTime,
				headerImage: tutorial.headerImage,
				reward: tutorial.reward,
				isVideo: tutorial.isVideo,
				date: tutorial.date,
				tags: tutorial.tags,
			});

			courses.sort(compare);
		});
		this.baseCourses = courses;
		this.setState({tags, courses});
		const icons = document.getElementsByClassName('academy-dashboard-icon');

		if (icons.length > 0) {
			icons[0].classList.remove('fixed');
			icons[0].style.left = 'inherit';
		}

		window.Intercom('trackEvent', 'openedAcademyHome');
	}

	setActiveTag(tag) {
		return this.setState({activeTag: tag});
	}

	areAllCourseRead() {
		let isAllRead = true;

		Object.keys(this.props.academyProgress).forEach((key) => {
			if (
				typeof this.props.academyProgress[key] === 'object'
				&& !this.props.academyProgress[key].completed
				&& key !== 'lastCourse'
				&& key !== 'areAllCourseRead'
			) {
				isAllRead = false;
			}
		});
		if (isAllRead && !this.props.academyCompleted) {
			this.props.setCompletedAcademy();
		}
		return isAllRead;
	}

	render() {
		const {activeTag} = this.state;
		const {academyProgress, academyCompleted} = this.props;

		return (
			<div className="academy-base academy-home">
				<div className="academy-home-header">
					<InlineSVG
						className="academy-home-header-icon-postit"
						element="div"
						src={postitSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-iphone"
						element="div"
						src={iphoneSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-redbook"
						element="div"
						src={redbookSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-macbook"
						element="div"
						src={macbookSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-pen"
						element="div"
						src={penSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-coffee"
						element="div"
						src={coffeeSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-ruler"
						element="div"
						src={rulerSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-bluebook"
						element="div"
						src={bluebookSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-paper"
						element="div"
						src={paperSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-loupe"
						element="div"
						src={loupeSvg}
					/>
					<InlineSVG
						className="academy-home-header-icon-blackpen"
						element="div"
						src={blackpenSvg}
					/>
					{academyCompleted && (
						<InlineSVG
							className="academy-home-header-icon-medal"
							element="div"
							src={medalHomeSvg}
						/>
					)}
				</div>
				<div className="academy-home-tags">
					<div
						key={'tag-all'}
						onClick={() => {
							this.setActiveTag('all');
						}}
						className={`academy-home-tags-tag ${
							activeTag === 'all' ? 'active' : ''
						}`}
					>
						All courses
					</div>
					{this.state.tags.map(tag => (
						<div
							key={`tag-${tag}`}
							className={`academy-home-tags-tag ${
								activeTag === tag ? 'active' : ''
							}`}
							onClick={() => {
								this.setActiveTag(tag);
							}}
						>
							{tag}
						</div>
					))}
				</div>
				<ReactMotionFlip
					className="academy-course-list"
					childClassName="academy-course-list-elem"
					springConfig={{stiffness: 220, damping: 30}}
				>
					{this.state.courses
						.filter(
							tutorial =>
								activeTag === 'all' || tutorial.tags.includes(activeTag),
						)
						.map((tutorial) => {
							const progress = academyProgress[tutorial.slug] || {};
							const numberOfCompletedParts = (progress.parts || []).reduce(
								(count, {completed}) => count + (completed ? 1 : 0),
								0,
							);

							return (
								<CourseCard
									key={tutorial.title}
									reading={academyProgress.lastCourse === tutorial.slug}
									done={
										tutorial.partCount > 0
										&& numberOfCompletedParts === tutorial.partCount
									}
									tutorial={tutorial}
									numberOfCompletedParts={numberOfCompletedParts}
								/>
							);
						})}
				</ReactMotionFlip>
			</div>
		);
	}
}

AcademyHome.defaultProps = {
	academyProgress: {},
	setCompletedAcademy: () => {},
};

AcademyHome.propTypes = {
	academyProgress: PropTypes.object.isRequired,
	setCompletedAcademy: PropTypes.func,
};

export default AcademyHome;
